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

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
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
      "temperature": 0.3,
      "topP": 0.9,
      "maxOutputTokens": 1000
    }
  };

  try {
    const response = await fetch(GEMINI_URL, {
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
    const { vieText, inputText, level, topic } = await req.json();

    // Validate input
    if (!vieText || !inputText || !level || !topic) {
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
    const trimmedLevel = level.trim();
    const trimmedTopic = topic.trim();

    // Tạo prompt tích hợp cho Gemini để vừa đánh giá vừa tạo câu mới nếu cần
    const prompt = `
You are an English teacher helping Vietnamese students translate sentences accurately.

Task: Evaluate the student's English translation and provide detailed feedback. If the student scores well (7.0 or above), also generate a new Vietnamese sentence for practice.

Vietnamese sentence: "${trimmedVieText}"
Student's English translation: "${trimmedInputText}"

Evaluation criteria:
- Meaning accuracy (most important)
- Grammar correctness  
- Vocabulary appropriateness
- Natural expression in English

Please respond in this EXACT format:
CORRECT_TRANSLATION: [Provide the most natural and accurate English translation]
IS_CORRECT: [true if the translation is acceptable with correct meaning and grammar, false if there are significant errors]
EXPLANATION: [Detailed explanation in VIETNAMESE(just VIETNAMESE please) about what's good/wrong, including grammar and vocabulary feedback]
SCORE: [Score from 0.0 to 10.0, where 10.0 is perfect, 9.0+ is excellent, 7.0-8.0 is good, 5.0-6.0 is acceptable, below 5.0 needs improvement]
NEW_SENTENCE: [Only if SCORE is 7.0 or above: Generate a new simple Vietnamese sentence (8-15 words) suitable for English translation practice, with topic from user is "${trimmedTopic}" and difficulty level is "${trimmedLevel} TOEIC". The sentence should use basic to intermediate grammar, have clear meaning, and be practical. If SCORE is below 7.0, leave this completely empty]

Important notes:
- If meaning is completely wrong, IS_CORRECT should be false and SCORE should be low
- If there are grammar mistakes that affect clarity, IS_CORRECT should be false  
- Minor word choice issues might still be acceptable if meaning is clear
- Be encouraging but accurate in your evaluation
- Always provide a correction for the student's translation
- Use clear and simple Vietnamese for explanations
- Only provide NEW_SENTENCE if the student deserves it (SCORE >= 7.0)
- The new sentence should be different from the current one and suitable for translation practice
`;

    let fullResponse: string;
    try {
      // Gọi Gemini API
      fullResponse = await callGeminiAPI(prompt);
    } catch (error) {
      console.error('Gemini API error:', error);
      return NextResponse.json({
        isCorrect: false,
        correction: 'Không thể kết nối đến AI model',
        explanation: 'Có lỗi khi kết nối đến AI. Vui lòng thử lại.',
        score: 0.0,
        newText: null
      });
    }

    // Parse response từ Gemini
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