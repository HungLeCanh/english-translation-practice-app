'use client';
import React, { useState } from 'react';
import { CheckCircle, XCircle, BookOpen, Award, RefreshCw } from 'lucide-react';

const levels = [
  { level: 'A1', text: 'Xin chào' },
  { level: 'A2', text: 'Tôi thích học tiếng Anh' },
  { level: 'B1', text: 'Hôm nay trời đẹp, chúng ta nên đi dạo' },
  { level: 'B2', text: 'Tôi nghĩ rằng việc học ngoại ngữ rất quan trọng trong thời đại toàn cầu hóa' },
  { level: 'C1', text: 'Trong thế giới hiện đại, việc giao tiếp hiệu quả bằng nhiều ngôn ngữ là một kỹ năng quý giá' },
  { level: 'C2', text: 'Sự hiểu biết sâu sắc về văn hóa và ngôn ngữ khác nhau giúp chúng ta trở thành công dân toàn cầu tốt hơn' }
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

  // chọn độ khó
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = e.target.value;
    setCurrentLevel(selectedLevel);
    const selectedSentence = levels.find(level => level.level === selectedLevel)?.text || 'Xin chào';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🇻🇳 → 🇺🇸 Luyện dịch cùng AI
          </h1>
          <p className="text-gray-600">
            Cải thiện kỹ năng dịch tiếng Anh với sự hỗ trợ của AI thông minh
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Reset Button */}
          <div className="flex justify-end gap-2 mb-6">
            {/* Hiển thị label nhỏ để chọn độ khó và combobox */}
            <div className="flex items-center justify-center gap-2">
              <label className="text-sm text-gray-600 mr-2">Chọn độ khó:</label>
              <select
                value={currentLevel}
                onChange={handleLevelChange}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map((level) => (
                  <option key={level.level} value={level.level}>
                    {level.level}
                  </option>
                ))}
              </select>
            </div>
            {/* Hiển thị label nhỏ để chọn chủ đề và combobox */}
            <div className="flex items-center justify-center gap-2">
              <label className="text-sm text-gray-600 mr-2">Chọn chủ đề:</label>
              <select
                value={currentTopic}
                onChange={handleTopicChange}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            <button
              onClick={resetSentence}
              className="group flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={16} id="refreshIcon" className="group-hover:animate-spin" />
              Bắt đầu lại
            </button>
          </div>

          {/* Vietnamese Sentence */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Dịch câu sau sang tiếng Anh:
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-lg font-medium text-blue-900">
                &quot;{currentVietnamese}&quot;
              </p>
            </div>
          </div>

          {/* Translation Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✍️ Bản dịch của bạn:
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Nhập bản dịch tiếng Anh tại đây..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim() || isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
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
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                💡 Gợi ý
              </button>
            </div>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Gợi ý:</strong> Chú ý đến thì của động từ và chủ ngữ trong câu. Hãy dịch từng từ một cách cẩn thận.
              </p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {/* Score */}
              <div className={`${getScoreBackground(feedback.score)} rounded-xl p-6 text-center`}>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Award className={getScoreColor(feedback.score)} size={32} />
                  <span className={`text-3xl font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/10
                  </span>
                </div>
                <p className="text-gray-600">
                  {feedback.score >= 8 ? 'Xuất sắc!' : 
                   feedback.score >= 6 ? 'Tốt, cần cải thiện!' : 
                   'Cần luyện tập thêm!'}
                </p>
                {feedback.isCorrect && feedback.newText && (
                  <p className="text-green-600 font-medium mt-2">
                    🎉 Chuyển sang câu mới trong 10 giây...
                  </p>
                )}
              </div>

              {/* Correction */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {feedback.isCorrect ? (
                    <CheckCircle className="text-green-500 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-500 mt-1" size={20} />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {feedback.isCorrect ? '✅ Bản dịch chính xác!' : '📝 Bản dịch chuẩn:'}
                    </h3>
                    <div className="relative">
                      <p className="text-lg bg-green-50 border border-green-200 rounded-lg p-3 pe-40 font-medium text-green-900 pr-16 relative">
                        &quot;{feedback.correction}&quot;
                        <button
                          type="button"
                          className="absolute top-1 right-1 opacity-70 hover:opacity-100 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => {
                            navigator.clipboard.writeText(feedback.correction);
                          }}
                          title="Copy to clipboard"
                        >
                          📋 Copy
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Feedback */}
                {feedback.explanation && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="text-blue-500 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">📚 Giải thích chi tiết:</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 space-y-2">
                        {feedback.explanation
                          .split(/\*\s+/) // Tách từng mục bắt đầu bằng *
                          .filter((line: string) => line.trim() !== "") // Bỏ dòng rỗng
                          .map((line: string, idx: React.Key | null | undefined) => {
                            const parts = line.split(/(\*\*[^\*]+\*\*)/g); // Tách phần in đậm

                            return (
                              <p key={idx}>
                                *{" "}
                                {parts.map((part, i) => {
                                  if (/^\*\*[^\*]+\*\*$/.test(part)) {
                                    return (
                                      <strong key={i} className="font-semibold">
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  } else {
                                    return <span key={i}>{part}</span>;
                                  }
                                })}
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
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🤖 Được hỗ trợ bởi AI • Phát triển bởi Lê Cảnh Hùng • Luyện tập đều đặn để tiến bộ nhanh chóng!</p>
        </div>
      </div>
    </div>
  );
}