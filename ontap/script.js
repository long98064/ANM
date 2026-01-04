let fullQuestionBank = [];
let currentQuizData = [];
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; // Mảng lưu các câu làm sai

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizBox = document.getElementById('quiz-box');
const resultBox = document.getElementById('result-box');
const startBtn = document.getElementById('start-btn');
const totalCountSpan = document.getElementById('total-questions-count');

const questionElement = document.getElementById('question-text');
const answerButtonsElement = document.getElementById('options-container');
const nextButton = document.getElementById('next-btn');
const progressText = document.getElementById('question-count');
const scoreText = document.getElementById('score');
const progressBar = document.getElementById('progress-bar');
const reviewContainer = document.getElementById('review-container');
const reviewList = document.getElementById('review-list');

// 1. Tải dữ liệu
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        fullQuestionBank = await response.json();
        
        totalCountSpan.innerText = fullQuestionBank.length;
        startBtn.innerText = "BẮT ĐẦU NGAY";
        startBtn.disabled = false;
        
    } catch (error) {
        console.error("Lỗi:", error);
        totalCountSpan.innerText = "Lỗi tải file!";
    }
}

// 2. Bắt đầu (Lấy TẤT CẢ câu hỏi đã xáo trộn)
function startQuiz() {
    startScreen.classList.add('hide');
    quizBox.classList.remove('hide');
    
    // Xáo trộn ngẫu nhiên nhưng lấy hết toàn bộ
    currentQuizData = fullQuestionBank.sort(() => 0.5 - Math.random());
    
    currentQuestionIndex = 0;
    score = 0;
    wrongAnswers = []; // Reset danh sách câu sai
    setNextQuestion();
}

// 3. Hiển thị câu hỏi
function setNextQuestion() {
    resetState();
    if (currentQuestionIndex < currentQuizData.length) {
        showQuestion(currentQuizData[currentQuestionIndex]);
    } else {
        showResult();
    }
}

function showQuestion(questionData) {
    // Cập nhật thanh tiến trình
    const progressPercent = ((currentQuestionIndex) / currentQuizData.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
    
    progressText.innerText = `Câu ${currentQuestionIndex + 1}/${currentQuizData.length}`;
    scoreText.innerText = `Điểm: ${score}`;
    questionElement.innerText = questionData.question;

    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('btn');
        
        // Lưu index vào nút để so sánh
        button.dataset.index = index;
        
        if (index === questionData.answer) {
            button.dataset.correct = "true";
        }
        
        button.addEventListener('click', (e) => selectAnswer(e, questionData));
        answerButtonsElement.appendChild(button);
    });
}

function resetState() {
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// 4. Xử lý chọn đáp án (Logic Màu Đỏ/Xanh)
function selectAnswer(e, questionData) {
    const selectedButton = e.target;
    
    // Kiểm tra xem người dùng chọn đúng hay sai
    const isCorrect = selectedButton.dataset.correct === "true";
    
    // 1. Xử lý điểm số
    if (isCorrect) {
        score++;
        scoreText.innerText = `Điểm: ${score}`;
    } else {
        // Nếu sai, lưu vào danh sách câu sai để xem lại
        wrongAnswers.push({
            question: questionData.question,
            correctAnswer: questionData.options[questionData.answer],
            userAnswer: selectedButton.innerText
        });
    }

    // 2. Xử lý màu sắc cho TẤT CẢ các nút
    Array.from(answerButtonsElement.children).forEach(button => {
        // Reset trạng thái cũ (nếu có)
        button.classList.remove('correct', 'wrong', 'dim');

        // Logic hiển thị màu
        if (button.dataset.correct === "true") {
            // A. Đây là đáp án đúng -> Luôn Xanh
            button.classList.add('correct');
        } else if (button === selectedButton && !isCorrect) {
            // B. Đây là nút bạn chọn (và nó sai) -> Đỏ
            button.classList.add('wrong');
        } else {
            // C. Các nút còn lại (Sai và không được chọn) -> Làm tối đi
            button.classList.add('dim');
        }
        
        // Khóa tất cả các nút lại không cho bấm nữa
        button.disabled = true;
    });

    // Hiện nút Next
    nextButton.classList.remove('hide');
}
function nextQuestion() {
    currentQuestionIndex++;
    setNextQuestion();
}

loadQuestions();