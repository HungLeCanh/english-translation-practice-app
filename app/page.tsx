'use client';
import React, { useState } from 'react';
import { CheckCircle, XCircle, BookOpen, Award, RefreshCw } from 'lucide-react';

const languages = ["Tiếng Anh", "Tiếng Trung", "Tiếng Nhật", "Tiếng Hàn"];

const levels = [
  // Tiếng Anh (CEFR)
  { language: "Tiếng Anh", level: 'A1', text: 'Xin chào' },
  { language: "Tiếng Anh", level: 'A2', text: 'Tôi thích học tiếng Anh' },
  { language: "Tiếng Anh", level: 'B1', text: 'Hôm nay trời đẹp, chúng ta nên đi dạo' },
  { language: "Tiếng Anh", level: 'B2', text: 'Tôi nghĩ rằng việc học ngoại ngữ rất quan trọng trong thời đại toàn cầu hóa' },
  { language: "Tiếng Anh", level: 'C1', text: 'Trong thế giới hiện đại, việc giao tiếp hiệu quả bằng nhiều ngôn ngữ là một kỹ năng quý giá' },
  { language: "Tiếng Anh", level: 'C2', text: 'Sự hiểu biết sâu sắc về văn hóa và ngôn ngữ khác nhau giúp chúng ta trở thành công dân toàn cầu tốt hơn' },

  // Tiếng Trung (HSK)
  { language: "Tiếng Trung", level: 'HSK1', text: 'Xin chào' },
  { language: "Tiếng Trung", level: 'HSK2', text: 'Tôi có một anh trai và một em gái.' },
  { language: "Tiếng Trung", level: 'HSK3', text: 'Thời tiết hôm nay rất đẹp, chúng ta cùng đi công viên nhé.' },
  { language: "Tiếng Trung", level: 'HSK4', text: 'Học ngoại ngữ rất có ích cho công việc tương lai.' },
  { language: "Tiếng Trung", level: 'HSK5', text: 'Trong xã hội hiện đại, hiểu biết các nền văn hóa khác nhau rất quan trọng.' },
  { language: "Tiếng Trung", level: 'HSK6', text: 'Thông qua việc học ngôn ngữ, chúng ta có thể trở thành công dân toàn cầu tốt hơn.' },

  // Tiếng Nhật (JLPT)
  { language: "Tiếng Nhật", level: 'N5', text: 'Xin chào' },
  { language: "Tiếng Nhật", level: 'N4', text: 'Tôi học tiếng Nhật mỗi ngày.' },
  { language: "Tiếng Nhật", level: 'N3', text: 'Hôm nay trời đẹp, hãy đi dạo nhé.' },
  { language: "Tiếng Nhật", level: 'N2', text: 'Việc học ngoại ngữ rất quan trọng cho tương lai.' },
  { language: "Tiếng Nhật", level: 'N1', text: 'Hiểu biết về các nền văn hóa và ngôn ngữ khác giúp chúng ta trở thành công dân toàn cầu tốt hơn.' },

  // Tiếng Hàn (TOPIK)
  { language: "Tiếng Hàn", level: 'TOPIK 1', text: 'Xin chào' },
  { language: "Tiếng Hàn", level: 'TOPIK 2', text: 'Tôi học tiếng Hàn mỗi ngày.' },
  { language: "Tiếng Hàn", level: 'TOPIK 3', text: 'Hôm nay trời đẹp, đi dạo thôi.' },
  { language: "Tiếng Hàn", level: 'TOPIK 4', text: 'Việc học ngoại ngữ rất quan trọng cho tương lai.' },
  { language: "Tiếng Hàn", level: 'TOPIK 5', text: 'Hiểu biết nhiều nền văn hóa rất quan trọng trong xã hội hiện đại.' },
  { language: "Tiếng Hàn", level: 'TOPIK 6', text: 'Học ngôn ngữ giúp chúng ta trở thành công dân toàn cầu tốt hơp.' },
];


const  topics = [ "Tất cả", "Gia đình", "Bạn bè", "Công việc", "Học tập", "Sở thích", "Du lịch", "Thể thao", "Văn hóa", "Ẩm thực", "Công nghệ", "Giáo dục", "Sức khỏe", "Môi trường", "Khoa học", "Lịch sử", "Nghệ thuật", "Âm nhạc", "Phim ảnh", "Thời trang", "Xã hội"];

export default function TranslationApp() {
  const [currentVietnamese, setCurrentVietnamese] = useState('Xin chào');
  const [userInput, setUserInput] = useState('');
  interface Feedback {
    isCorrect: boolean;
    correction: string;
    explanation?: string;
    score: number;
    newText?: string;
  }

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // Thêm state cho ngôn ngữ, độ khó và chủ đề
  const [currentLanguage, setCurrentLanguage] = useState('Tiếng Anh');
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [currentTopic, setCurrentTopic] = useState('Tất cả');

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vieText: currentVietnamese,
          inputText: userInput.trim(),
          language: currentLanguage,
          level: currentLevel,
          topic: currentTopic
        })
      });

      const result = await response.json();
      console.log('API Response:', result);
      setFeedback(result);
      
      // Nếu bản dịch đúng, cập nhật câu mới
      if (result.isCorrect && result.newText) {
        setTimeout(() => {
          setCurrentVietnamese(result.newText);
          setUserInput('');
          setFeedback(null);
          setShowHint(false);
        }, 10000); // Hiển thị kết quả 10 giây trước khi chuyển câu mới
      }
      
    } catch (error) {
      console.error('Error:', error);
      setFeedback({
        isCorrect: false,
        correction: 'Có lỗi khi kết nối đến server. Vui lòng thử lại.',
        explanation: 'Lỗi kết nối mạng.',
        score: 0
      });
    }
    
    setIsLoading(false);
  };

  // chọn ngôn ngữ
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;
    setCurrentLanguage(selectedLanguage);
    
    // Lấy level đầu tiên của ngôn ngữ được chọn
    const firstLevelOfLanguage = levels.find(level => level.language === selectedLanguage);
    if (firstLevelOfLanguage) {
      setCurrentLevel(firstLevelOfLanguage.level);
      setCurrentVietnamese(firstLevelOfLanguage.text);
    }
    
    setUserInput('');
    setFeedback(null);
    setShowHint(false);
  }

  // chọn độ khó
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = e.target.value;
    setCurrentLevel(selectedLevel);
    const selectedSentence = levels.find(level => level.level === selectedLevel && level.language === currentLanguage)?.text || 'Xin chào';
    setCurrentVietnamese(selectedSentence);
    setUserInput('');
    setFeedback(null);
    setShowHint(false);
  }
  // chọn chủ đề
  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTopic = e.target.value;
    setCurrentTopic(selectedTopic);
  }

  const resetSentence = () => {
    setCurrentVietnamese('Xin chào');
    setUserInput('');
    setFeedback(null);
    setShowHint(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 flex flex-col items-center justify-center">
          <h1 className="text-xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-2 flex items-center gap-2 px-2">
            <span className="text-base sm:text-4xl">Vie</span>
            <span className="text-base sm:text-4xl">-</span>
            <img src="/globe.svg" alt="Globe icon" className="w-5 h-5 sm:w-8 sm:h-8 mx-1" />
            <span className="text-base sm:text-4xl leading-tight">Luyện dịch đa ngôn ngữ cùng AI</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-600 px-4 sm:px-2 leading-relaxed max-w-md sm:max-w-none">
            Cải thiện kỹ năng dịch đa ngôn ngữ với sự hỗ trợ của AI thông minh
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          {/* Controls - Mobile Optimized */}
          <div className="mb-4 sm:mb-6">
            {/* Level and Topic Selection - Stack on mobile, evenly spaced on desktop */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 sm:max-w-xs">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0 sm:mr-2 sm:inline">
                  Chọn ngôn ngữ:
                </label>
                <select
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  className="w-full text-black border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

                <div className="flex-1 sm:max-w-xs">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0 sm:mr-2 sm:inline">
                  Chọn độ khó:
                </label>
                <select
                  value={currentLevel}
                  onChange={handleLevelChange}
                  className="w-full text-black border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {levels
                  .filter((level) => level.language === currentLanguage)
                  .map((level) => (
                    <option key={level.level} value={level.level}>
                    {level.level}
                    </option>
                  ))}
                </select>
                </div>
              
              <div className="flex-1 sm:max-w-xs">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0 sm:mr-2 sm:inline">
                  Chọn chủ đề:
                </label>
                <select
                  value={currentTopic}
                  onChange={handleTopicChange}
                  className="w-full text-black border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>

            {/* Reset button - Full width on mobile, align right on desktop */}
            <div className="flex">
              <button
                onClick={resetSentence}
                className="w-full sm:w-auto sm:ml-auto group flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <RefreshCw size={16} id="refreshIcon" className="group-hover:animate-spin" />
                Bắt đầu lại
              </button>
            </div>
          </div>

          {/* Vietnamese Sentence */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Dịch câu sau sang {currentLanguage}:
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-base sm:text-lg font-medium text-blue-900 leading-relaxed">
                &quot;{currentVietnamese}&quot;
              </p>
            </div>
          </div>

          {/* Translation Input */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✍️ Bản dịch của bạn:
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="text-black w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                rows={3}
                placeholder="Nhập bản dịch tiếng Anh tại đây..."
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim() || isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={16} />
                    Đang kiểm tra...
                  </span>
                ) : (
                  '🔍 Kiểm tra bản dịch'
                )}
              </button>
              
              <button
                onClick={() => setShowHint(!showHint)}
                className="sm:w-auto px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                💡 Gợi ý
              </button>
            </div>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Gợi ý:</strong> Chú ý đến thì của động từ và chủ ngữ trong câu. Hãy dịch từng từ một cách cẩn thận.
              </p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Score */}
              <div className={`${getScoreBackground(feedback.score)} rounded-xl p-4 sm:p-6 text-center`}>
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                  <Award className={getScoreColor(feedback.score)} size={24} />
                  <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/10
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-600">
                  {feedback.score >= 8 ? 'Xuất sắc!' : 
                  feedback.score >= 6 ? 'Tốt, cần cải thiện!' : 
                  'Cần luyện tập thêm!'}
                </p>
                {feedback.isCorrect && feedback.newText && (
                  <p className="text-green-600 font-medium mt-2 text-sm sm:text-base">
                    🎉 Chuyển sang câu mới trong 10 giây...
                  </p>
                )}
              </div>

              {/* Correction */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  {feedback.isCorrect ? (
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                  ) : (
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={18} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                      {feedback.isCorrect ? '✅ Bản dịch chính xác!' : '📝 Bản dịch chuẩn:'}
                    </h3>
                    <div className="relative">
                      <p className="text-sm sm:text-lg bg-green-50 border border-green-200 rounded-lg p-3 font-medium text-green-900 pr-12 sm:pr-16 break-words">
                        &quot;{feedback.correction}&quot;
                        <button
                          type="button"
                          className="absolute top-1 right-1 opacity-70 hover:opacity-100 bg-white border border-gray-200 rounded px-1 sm:px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => {
                            navigator.clipboard.writeText(feedback.correction);
                          }}
                          title="Copy to clipboard"
                        >
                          📋
                          <span className="hidden sm:inline ml-1">Copy</span>
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Feedback */}
                {feedback.explanation && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <BookOpen className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                        📚 Giải thích chi tiết:
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 space-y-2 text-sm sm:text-base">
                        {feedback.explanation
                          .split("\n") // Tách từng dòng theo xuống dòng
                          .filter((line: string) => line.trim() !== "") // Bỏ dòng rỗng
                          .map((line: string, idx: React.Key) => {
                            const parts = line.split(/(\*\*[^\*]+\*\*)/g); // Tách phần in đậm

                            return (
                              <p key={idx} className="leading-relaxed">
                                {" "}
                                {parts.map((part, i) =>
                                  /^\*\*[^\*]+\*\*$/.test(part) ? (
                                    <strong key={i} className="font-semibold">
                                      {part.slice(2, -2)}
                                    </strong>
                                  ) : (
                                    <span key={i}>{part}</span>
                                  )
                                )}
                              </p>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm px-2">
          <p className="leading-relaxed">
            🤖 Được hỗ trợ bởi AI • Phát triển bởi Lê Cảnh Hùng<br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>Luyện tập đều đặn để tiến bộ nhanh chóng!
          </p>
        </div>
      </div>
    </div>
  );
}