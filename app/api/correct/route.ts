// app/api/correct/route.ts
import { NextRequest, NextResponse } from "next/server";

// Fallback sentences cho trường hợp cần thiết
const FALLBACK_SENTENCES = [
  "Tôi thích uống cà phê vào buổi sáng.",
  "Cô ấy đang học tiếng Anh ở trường đại học.",
  "Chúng tôi sẽ đi du lịch vào tuần tới.",
  "Anh ấy đã hoàn thành công việc của mình.",
  "Họ đang chờ xe buýt ở trạm.",
  "Hôm nay trời đẹp và nắng ấm.",
  "Chúng ta cần hoàn thành bài tập về nhà.",
  "Bà ấy đang nấu ăn trong bếp.",
  "Các em học sinh đang chơi trong sân trường.",
  "Anh ta thường xuyên tập thể dục buổi tối."
];

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// API GEMINI phụ để tránh lỗi quá tải
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GEMINI_URL_2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY_2}`;

async function callGeminiAPI(prompt: string, geminiURL: string, apiKeyName: string): Promise<string> {
  // Check API key existence based on URL
  if (!geminiURL || geminiURL.endsWith('undefined')) {
    throw new Error(`${apiKeyName} not found in environment variables`);
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": prompt
          }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.8,
      "topP": 0.95,
      "maxOutputTokens": 1000
    }
  };

  try {
    const response = await fetch(geminiURL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    // Extract text from Gemini response
    if (responseData.candidates && responseData.candidates.length > 0) {
      const candidate = responseData.candidates[0];
      if (candidate.content && candidate.content.parts) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error("Invalid response format from Gemini API");

  } catch (error) {
    throw new Error(`Gemini API request failed: ${error}`);
  }
}

function parseGeminiResponse(fullResponse: string, vieText: string) {
  let correction = "";
  let isCorrect = false;
  let explanation = "";
  let parsedScore = 0.0;
  let newText: string | null = null;

  // Parse CORRECT_TRANSLATION
  if (fullResponse.includes("CORRECT_TRANSLATION:")) {
    const correctionPart = fullResponse.split("CORRECT_TRANSLATION:")[1];
    if (correctionPart.includes("IS_CORRECT:")) {
      correction = correctionPart.split("IS_CORRECT:")[0].trim();
    } else {
      correction = correctionPart.trim();
    }
  }

  // Parse IS_CORRECT
  if (fullResponse.includes("IS_CORRECT:")) {
    const isCorrectPart = fullResponse.split("IS_CORRECT:")[1];
    let isCorrectText: string;
    if (isCorrectPart.includes("EXPLANATION:")) {
      isCorrectText = isCorrectPart.split("EXPLANATION:")[0].trim().toLowerCase();
    } else {
      isCorrectText = isCorrectPart.trim().toLowerCase();
    }
    isCorrect = isCorrectText.includes('true');
  }

  // Parse EXPLANATION
  if (fullResponse.includes("EXPLANATION:")) {
    const explanationPart = fullResponse.split("EXPLANATION:")[1];
    if (explanationPart.includes("SCORE:")) {
      explanation = explanationPart.split("SCORE:")[0].trim();
    } else {
      explanation = explanationPart.trim();
    }
  }

  // Parse SCORE
  if (fullResponse.includes("SCORE:")) {
    const scorePart = fullResponse.split("SCORE:")[1];
    let scoreText: string;
    if (scorePart.includes("NEW_SENTENCE:")) {
      scoreText = scorePart.split("NEW_SENTENCE:")[0].trim();
    } else {
      scoreText = scorePart.trim();
    }

    // Tìm số thập phân trong scoreText
    const scoreMatch = scoreText.match(/(\d*\.?\d+)/);
    if (scoreMatch) {
      try {
        parsedScore = parseFloat(scoreMatch[1]);
        // Đảm bảo score trong khoảng 0-10
        parsedScore = Math.max(0.0, Math.min(10.0, parsedScore));
      } catch (error) {
        console.error("Error parsing score:", error);
        parsedScore = 0.0;
      }
    }
  }

  // Parse NEW_SENTENCE (chỉ có khi điểm >= 7.0)
  if (fullResponse.includes("NEW_SENTENCE:")) {
    const newSentencePart = fullResponse.split("NEW_SENTENCE:")[1].trim();
    // Loại bỏ dấu ngoặc kép nếu có và kiểm tra tính hợp lệ
    const newSentenceCleaned = newSentencePart.replace(/^["']|["']$/g, '').trim();

    // Chỉ sử dụng nếu điểm >= 7.0 và câu hợp lệ
    if (parsedScore >= 7.0 && newSentenceCleaned && newSentenceCleaned.length > 5 && newSentenceCleaned.split(' ').length >= 3) {
      // Kiểm tra câu không phải là placeholder hay thông báo lỗi
      const invalidPhrases = ['empty', 'none', 'n/a', 'không có', 'trống'];
      if (!invalidPhrases.some(phrase => newSentenceCleaned.toLowerCase().includes(phrase))) {
        newText = newSentenceCleaned;
      }
    }
  }

  // Fallback values nếu không parse được
  if (!correction) {
    correction = "Không thể xác định bản dịch chính xác";
  }
  if (!explanation) {
    explanation = "Không có giải thích chi tiết";
  }

  // Nếu AI không tạo được câu mới mà điểm đủ cao, dùng fallback
  if (parsedScore >= 7.0 && !newText) {
    // Chọn ngẫu nhiên một câu khác với câu hiện tại
    const availableSentences = FALLBACK_SENTENCES.filter(s => s !== vieText);
    if (availableSentences.length > 0) {
      newText = availableSentences[Math.floor(Math.random() * availableSentences.length)];
    }
  }

  return {
    correction,
    isCorrect,
    explanation,
    score: parsedScore,
    newText
  };
}

export async function POST(req: NextRequest) {
  try {
    const { vieText, inputText, language, level, topic } = await req.json();

    // Validate input
    if (!vieText || !inputText || !language || !level || !topic ) {
      return NextResponse.json(
        {
          error: 'Missing vieText or inputText',
          isCorrect: false,
          correction: '',
          explanation: '',
          score: 0,
          newText: null
        },
        { status: 400 }
      );
    }

    const trimmedVieText = vieText.trim();
    const trimmedInputText = inputText.trim();
    const trimmedLanguage = language.trim().toLowerCase();
    const trimmedLevel = level.trim();
    let trimmedTopic = topic.trim();
    // nếu trimmedTopic là "Tất cả" thì tạo 1 chủ đề ngẫu nhiên từ danh sách các chủ đề
    const  topics = ["Gia đình", "Bạn bè", "Công việc", "Học tập", "Sở thích", "Du lịch", "Thể thao", "Văn hóa", "Ẩm thực", "Công nghệ", "Giáo dục", "Sức khỏe", "Môi trường", "Khoa học", "Lịch sử", "Nghệ thuật", "Âm nhạc", "Phim ảnh", "Thời trang", "Xã hội"];
    if (trimmedTopic === "Tất cả") {
      const randomIndex = Math.floor(Math.random() * topics.length);
      trimmedTopic = topics[randomIndex];
    }

    // Tạo prompt tích hợp cho Gemini để vừa đánh giá vừa tạo câu mới nếu cần
    const prompt = `
    Bạn là một giáo viên ngôn ngữ đang hỗ trợ học viên người Việt luyện dịch câu chính xác sang ngoại ngữ.

    Nhiệm vụ: Đánh giá bản dịch của học viên và đưa ra nhận xét chi tiết. Nếu học viên đạt điểm từ 7.0 trở lên, hãy tạo thêm một câu tiếng Việt mới phù hợp để học viên luyện tập thêm.

    Ngôn ngữ đang học: "${trimmedLanguage}"
    Cấp độ: "${trimmedLevel}"
    Chủ đề: "${trimmedTopic}"

    Câu tiếng Việt gốc: "${trimmedVieText}"
    Bản dịch của học viên: "${trimmedInputText}"

    Tiêu chí đánh giá:
    - Độ chính xác về nghĩa (quan trọng nhất)
    - Ngữ pháp đúng
    - Từ vựng phù hợp
    - Cách diễn đạt tự nhiên theo ngôn ngữ đang học

    Hãy phản hồi chính xác theo định dạng sau:
    CORRECT_TRANSLATION: [Bản dịch đúng và tự nhiên nhất sang ngôn ngữ đang học]
    IS_CORRECT: [true nếu bản dịch của học viên chấp nhận được, đúng ngữ pháp và đúng ý; false nếu sai lệch nghiêm trọng]
    EXPLANATION: [Giải thích CHI TIẾT BẰNG TIẾNG VIỆT về điểm đúng/sai, bao gồm lỗi từ vựng, ngữ pháp, cách diễn đạt]
    SCORE: [Điểm từ 0.0 đến 10.0, trong đó 10.0 là hoàn hảo, 9.0+ là rất tốt, 7.0–8.0 là tốt, 5.0–6.0 là tạm chấp nhận, dưới 5.0 là cần cải thiện]
    NEW_SENTENCE: [CHỈ khi SCORE từ 7.0 trở lên: Tạo một câu tiếng Việt mới (8–15 từ), khác câu gốc, phù hợp với chủ đề "${trimmedTopic}", độ khó tương ứng cấp độ "${trimmedLevel}" theo hệ thống ngôn ngữ (VD: HSK, JLPT, TOPIK, CEFR...). Câu nên rõ ràng, thực tế, ngữ pháp đơn giản hoặc trung cấp, phù hợp để dịch sang ngôn ngữ đang học. Nếu SCORE dưới 7.0, phần này để trống]

    Lưu ý:
    - Nếu nghĩa sai hoàn toàn, IS_CORRECT phải là false và điểm thấp
    - Nếu ngữ pháp sai khiến câu khó hiểu, IS_CORRECT cũng là false
    - Có thể chấp nhận lỗi nhỏ nếu không ảnh hưởng ý nghĩa
    - Luôn đưa ra bản dịch đúng nhất để học viên học hỏi
    - Giải thích nên ngắn gọn, rõ ràng, dễ hiểu bằng tiếng Việt
    - Nếu sai về ngữ pháp, hãy giai thích cụ thể lỗi sai (VD: "Thiếu chủ ngữ", "Sai thì động từ", "Dùng từ không phù hợp") và cấu trúc đúng(VD: sai thì quá khứ đơn thì đưa câu giải thích phải có cấu trúc câu của quá khứ đơn(S+V2/ed+O chẳng hạn, nên đưa phù hợp với câu hiện tại) và đặc điểm nhận biết của thì quá khứ đơn) của thì cần dùng(cho từng ngôn ngữ khác nhau)
    - Câu mới không được trùng câu gốc và phải hữu ích để luyện tập thêm
    - Nên xuống dòng đúng nơi ở nội dung phần EXPLAINATION để dễ đọc, ví dụ như xuốn dòng cho từng lỗi sai, hoặc xuống dòng sau mỗi câu giải thích ngắn gọn 
    - Bọc nội dung cần in đậm bằng cặp dấu sao (**lorem ipsum**) để dễ nhận diện
    - Giữa các requests, hãy đảm bảo không dùng lại nội dung đã được lưu trữ của AI, tôi đang thấy AI trả về các câu theo 1 thứ tự giống nhau mỗi lần vào website, điều này có thể do AI đang lưu trữ nội dung đã trả lời trước đó và không tạo ra nội dung mới mỗi lần. Hãy đảm bảo rằng mỗi lần gọi API đều tạo ra nội dung mới và không lặp lại các câu đã trả lời trước đó.
    `;

    let fullResponse: string;
    try {
      // Gọi Gemini API chính
      fullResponse = await callGeminiAPI(prompt, GEMINI_URL, 'GEMINI_API_KEY');
    } catch (error) {
      console.error('Gemini API error:', error, 'Trying fallback API');
      // Nếu gặp lỗi, thử gọi API phụ
      try {
        fullResponse = await callGeminiAPI(prompt, GEMINI_URL_2, 'GEMINI_API_KEY_2');
      } catch (fallbackError) {
        console.error('Fallback Gemini API error:', fallbackError);
        return NextResponse.json({
          isCorrect: false,
          correction: 'Không thể kết nối đến AI model, hãy thử nhấn kiểm tra lại sau 1-2 phút',
          explanation: 'Có lỗi khi kết nối đến AI. Hệ thống quá tải, vui lòng thử lại sau 1-2 phút.',
          score: 0.0,
          newText: null
        });
      }
    }

    // Parse response từ Gemini
    // console.log('Full Gemini response:', fullResponse);
    const result = parseGeminiResponse(fullResponse, trimmedVieText);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        isCorrect: false,
        correction: 'Có lỗi xảy ra trong quá trình xử lý',
        explanation: 'Vui lòng thử lại sau',
        score: 0.0,
        newText: null
      },
      { status: 500 }
    );
  }
}