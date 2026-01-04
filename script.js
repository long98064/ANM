// ==============================================
// 1. KHAI BÁO BIẾN VÀ CẤU HÌNH
// ==============================================

// Dữ liệu câu hỏi
let fullQuestionBank = [];
let currentQuizData = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; // Danh sách câu làm sai để review cuối giờ

// Biến tính năng Gỡ điểm (Redemption) - Chỉ dùng cho chế độ Practice
let blockMistakes = []; // Lưu câu sai trong 10 câu gần nhất
let blockCount = 0;     // Đếm số câu đã làm trong block
let isRedemptionMode = false; // Trạng thái đang gỡ điểm
let redemptionQuestion = null; // Câu hỏi gỡ điểm hiện tại
let currentMode = 'practice'; // 'practice' hoặc 'test'

// Biến tính năng Streak (Chuỗi thắng)
let streak = 0;

// Cài đặt (Settings)
let isSfxOn = true;    // Bật tiếng đúng/sai
let isMusicOn = false; // Bật nhạc nền (Mặc định tắt)
let isStreakOn = true; // Bật hiệu ứng Streak

// Âm thanh
const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');
const bgMusic = document.getElementById('bg-music');
if (bgMusic) bgMusic.volume = 0.3; // Chỉnh nhạc nền nhỏ (30%)

// DOM Elements (Các phần tử HTML)
const startScreen = document.getElementById('start-screen');
const quizBox = document.getElementById('quiz-box');
const resultBox = document.getElementById('result-box');
const btnPractice = document.getElementById('btn-practice');
const btnTest = document.getElementById('btn-test');
const totalCountSpan = document.getElementById('total-questions-count');

const questionElement = document.getElementById('question-text');
const answerButtonsElement = document.getElementById('options-container');
const nextButton = document.getElementById('next-btn');
const progressText = document.getElementById('question-count');
const scoreText = document.getElementById('score');
const progressBar = document.getElementById('progress-bar');

const reviewContainer = document.getElementById('review-container');
const reviewList = document.getElementById('review-list');
const redemptionAlert = document.getElementById('redemption-alert');
const mainContainer = document.getElementById('main-container');

// DOM cho tính năng phụ
const streakBox = document.getElementById('streak-box');
const streakCountSpan = document.getElementById('streak-count');
const settingsModal = document.getElementById('settings-modal');
const toggleSfxBtn = document.getElementById('toggle-sfx');
const toggleBgmBtn = document.getElementById('toggle-bgm');
const toggleStreakBtn = document.getElementById('toggle-streak');


// ==============================================
// 2. TẢI DỮ LIỆU & CÀI ĐẶT
// ==============================================

// Tải câu hỏi từ file JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        fullQuestionBank = await response.json();
        totalCountSpan.innerText = fullQuestionBank.length;
        
        // Mở khóa nút bắt đầu khi tải xong
        btnPractice.disabled = false;
        btnTest.disabled = false;
    } catch (error) {
        console.error("Lỗi tải file json:", error);
        totalCountSpan.innerText = "Lỗi tải dữ liệu!";
    }
}

// Xử lý Cài đặt (Settings)
function toggleSettings() {
    settingsModal.classList.toggle('hide');
}

// Lắng nghe sự kiện thay đổi cài đặt
if (toggleSfxBtn) toggleSfxBtn.addEventListener('change', (e) => { isSfxOn = e.target.checked; });

if (toggleBgmBtn) toggleBgmBtn.addEventListener('change', (e) => {
    isMusicOn = e.target.checked;
    if (isMusicOn) {
        bgMusic.play().catch(err => console.log("Trình duyệt chặn tự phát nhạc:", err));
    } else {
        bgMusic.pause();
    }
});

if (toggleStreakBtn) toggleStreakBtn.addEventListener('change', (e) => {
    isStreakOn = e.target.checked;
    updateStreakDisplay(); // Cập nhật ngay lập tức
});


// ==============================================
// 3. LOGIC BẮT ĐẦU GAME
// ==============================================

function startQuiz(mode) {
    currentMode = mode;
    startScreen.classList.add('hide');
    quizBox.classList.remove('hide');
    streakBox.classList.add('hide'); // Ẩn streak lúc đầu
    
    // Phát nhạc nếu đang bật
    if (isMusicOn) bgMusic.play();

    // Reset toàn bộ biến
    score = 0;
    streak = 0;
    currentQuestionIndex = 0;
    wrongAnswers = [];
    blockMistakes = [];
    blockCount = 0;
    isRedemptionMode = false;
    
    // Xáo trộn câu hỏi
    const shuffled = fullQuestionBank.sort(() => 0.5 - Math.random());

    if (currentMode === 'test') {
        // CHẾ ĐỘ THI THỬ: Lấy 75 câu
        currentQuizData = shuffled.slice(0, 75);
    } else {
        // CHẾ ĐỘ ÔN TẬP: Lấy tất cả
        currentQuizData = shuffled;
    }
    
    setNextQuestion();
}


// ==============================================
// 4. HIỂN THỊ CÂU HỎI
// ==============================================

function setNextQuestion() {
    resetState();
    
    let questionToShow = null;

    if (isRedemptionMode) {
        // --- CHẾ ĐỘ GỠ ĐIỂM ---
        questionToShow = redemptionQuestion;
        
        // Đổi giao diện sang màu tím
        mainContainer.classList.add('redemption-theme');
        redemptionAlert.classList.remove('hide');
        progressText.innerText = "GỠ ĐIỂM";
    } else {
        // --- CHẾ ĐỘ BÌNH THƯỜNG ---
        if (currentQuestionIndex >= currentQuizData.length) {
            showResult();
            return;
        }
        questionToShow = currentQuizData[currentQuestionIndex];
        
        // Giao diện bình thường
        mainContainer.classList.remove('redemption-theme');
        redemptionAlert.classList.add('hide');
        
        // Cập nhật thanh tiến trình
        const progressPercent = ((currentQuestionIndex) / currentQuizData.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        progressText.innerText = `Câu ${currentQuestionIndex + 1}/${currentQuizData.length}`;
    }

    scoreText.innerText = `Điểm: ${score}`;
    questionElement.innerText = questionToShow.question;

    // Tạo các nút đáp án
    questionToShow.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('btn');
        
        // Đánh dấu đáp án đúng (ẩn trong data)
        if (index === questionToShow.answer) {
            button.dataset.correct = "true";
        }
        
        button.addEventListener('click', (e) => selectAnswer(e, questionToShow));
        answerButtonsElement.appendChild(button);
    });
}

function resetState() {
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}


// ==============================================
// 5. XỬ LÝ CHỌN ĐÁP ÁN
// ==============================================

function selectAnswer(e, questionData) {
    const selectedButton = e.target;
    const isCorrect = selectedButton.dataset.correct === "true";
    
    if (isCorrect) {
        // --- ĐÚNG ---
        if (isSfxOn) { correctSound.currentTime = 0; correctSound.play(); }
        
        score++;
        streak++; // Tăng chuỗi thắng
        
        // Hiệu ứng pháo giấy nếu đúng liên tiếp 5 câu và Streak đang bật
        if (streak % 5 === 0 && isStreakOn && typeof confetti === 'function') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        // Nếu đang gỡ điểm -> Xóa câu này khỏi danh sách sai
        if (isRedemptionMode) {
             wrongAnswers = wrongAnswers.filter(q => q.question !== questionData.question);
        }

    } else {
        // --- SAI ---
        if (isSfxOn) { wrongSound.currentTime = 0; wrongSound.play(); }
        
        streak = 0; // Reset streak về 0
        
        // Nếu không phải đang gỡ điểm -> Lưu vào danh sách sai
        if (!isRedemptionMode) {
            wrongAnswers.push({
                question: questionData.question,
                correctAnswer: questionData.options[questionData.answer],
                userAnswer: selectedButton.innerText
            });
            
            // Chỉ thêm vào block gỡ điểm nếu đang ở chế độ Practice
            if (currentMode === 'practice') {
                blockMistakes.push(questionData);
            }
        }
    }

    // Cập nhật giao diện điểm và streak
    scoreText.innerText = `Điểm: ${score}`;
    updateStreakDisplay();

    // Tô màu các nút và khóa lại
    Array.from(answerButtonsElement.children).forEach(button => {
        button.classList.remove('correct', 'wrong', 'dim');
        if (button.dataset.correct === "true") {
            button.classList.add('correct');
        } else if (button === selectedButton && !isCorrect) {
            button.classList.add('wrong');
        } else {
            button.classList.add('dim');
        }
        button.disabled = true;
    });

    // Hiện nút tiếp theo
    nextButton.classList.remove('hide');
}

// Hàm hiển thị hộp Streak
function updateStreakDisplay() {
    streakCountSpan.innerText = streak;
    // Chỉ hiện nếu Streak > 2 VÀ Cài đặt đang Bật
    if (streak > 2 && isStreakOn) {
        streakBox.classList.remove('hide');
    } else {
        streakBox.classList.add('hide');
    }
}


// ==============================================
// 6. XỬ LÝ CHUYỂN CÂU (Logic Gỡ Điểm)
// ==============================================

function handleNextButton() {
    // 1. Nếu vừa làm xong câu Gỡ Điểm -> Quay lại flow chính
    if (isRedemptionMode) {
        isRedemptionMode = false;
        redemptionQuestion = null;
        setNextQuestion();
        return;
    }

    // 2. Tăng index câu hỏi
    currentQuestionIndex++;
    
    // 3. Logic kích hoạt Gỡ Điểm (Chỉ chế độ Practice)
    if (currentMode === 'practice') {
        blockCount++;
        // Cứ mỗi 10 câu
        if (blockCount === 10) {
            blockCount = 0; // Reset đếm block
            
            // Nếu trong 10 câu qua có sai
            if (blockMistakes.length > 0) {
                // Chọn ngẫu nhiên 1 câu sai để làm lại
                const randomIndex = Math.floor(Math.random() * blockMistakes.length);
                redemptionQuestion = blockMistakes[randomIndex];
                
                isRedemptionMode = true;
                blockMistakes = []; // Reset danh sách lỗi của block này
                
                setNextQuestion(); // Render câu gỡ điểm
                return;
            }
        }
    }

    // 4. Chuyển câu tiếp theo bình thường
    setNextQuestion();
}


// ==============================================
// 7. KẾT QUẢ CUỐI CÙNG
// ==============================================

function showResult() {
    quizBox.classList.add('hide');
    resultBox.classList.remove('hide');
    streakBox.classList.add('hide');
    
    if (isMusicOn) bgMusic.pause(); // Tắt nhạc khi xong
    
    document.getElementById('final-score').innerText = `${score} / ${currentQuizData.length}`;

    // Render danh sách câu sai
    if (wrongAnswers.length > 0) {
        reviewContainer.classList.remove('hide');
        reviewList.innerHTML = "";
        wrongAnswers.forEach((item, index) => {
            const div = document.createElement('div');
            div.classList.add('review-item');
            div.innerHTML = `
                <p><strong>Câu ${index + 1}:</strong> ${item.question}</p>
                <p class="user-ans">❌ Bạn chọn: ${item.userAnswer}</p>
                <p class="correct-ans">✅ Đáp án đúng: ${item.correctAnswer}</p>
            `;
            reviewList.appendChild(div);
        });
    } else {
        reviewContainer.classList.add('hide');
    }
}

// Chạy hàm tải dữ liệu ngay khi vào trang
loadQuestions();
