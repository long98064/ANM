// ==============================================
// 1. KHAI BÁO BIẾN
// ==============================================
// Dữ liệu các môn
let anmQuestions = [];
let mathQuestions = [];
let commerceQuestions = [];
let marketingQuestions = [];

// Biến trạng thái hiện tại
let currentSubject = ''; // 'anm' hoặc 'commerce'
let currentQuizData = []; // Dữ liệu đang dùng để thi
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; 

// Tính năng phụ
let streak = 0;
let currentMode = 'practice';
let isRedemptionMode = false;
let redemptionQuestion = null;
let blockMistakes = []; 
let blockCount = 0;

// Cài đặt
let isSfxOn = true;
let isMusicOn = false;
let isStreakOn = true;

let scoreHistory = JSON.parse(localStorage.getItem('quiz_history')) || {}; // Load lịch sử điểm
let scoreChart = null; // Biến giữ biểu đồ

// Âm thanh
const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');
const bgMusic = document.getElementById('bg-music');
if(bgMusic) bgMusic.volume = 0.3;

// DOM Elements
const homeScreen = document.getElementById('home-screen'); // Màn hình chính
const startScreen = document.getElementById('start-screen'); // Màn hình chọn chế độ
const quizBox = document.getElementById('quiz-box');
const resultBox = document.getElementById('result-box');

const subjectTitle = document.getElementById('subject-title');
const totalCountSpan = document.getElementById('total-questions-count');
const btnMath = document.getElementById('btn-math');

// Quiz Elements
const questionElement = document.getElementById('question-text');
const answerButtonsElement = document.getElementById('options-container');
const nextButton = document.getElementById('next-btn');
const explanationBox = document.getElementById('explanation-box');
const progressText = document.getElementById('question-count');
const scoreText = document.getElementById('score');
const progressBar = document.getElementById('progress-bar');
const reviewContainer = document.getElementById('review-container');
const reviewList = document.getElementById('review-list');
const redemptionAlert = document.getElementById('redemption-alert');
const mainContainer = document.getElementById('main-container');

// Settings DOM
const streakBox = document.getElementById('streak-box');
const streakCountSpan = document.getElementById('streak-count');
const settingsModal = document.getElementById('settings-modal');
const toggleSfxBtn = document.getElementById('toggle-sfx');
const toggleBgmBtn = document.getElementById('toggle-bgm');
const toggleStreakBtn = document.getElementById('toggle-streak');


// ==============================================
// 2. TẢI DỮ LIỆU (Tất cả file)
// ==============================================
async function loadAllData() {
    try {
        // Tải ANM
        try {
            const r1 = await fetch('questions.json');
            anmQuestions = await r1.json();
        } catch(e) { console.log("Lỗi tải ANM", e); }

        // Tải Toán
        try {
            const r2 = await fetch('questions_math.json');
            mathQuestions = await r2.json();
        } catch(e) { console.log("Lỗi tải Toán", e); }

        // Tải TMĐT
        try {
            const r3 = await fetch('questions_commerce.json');
            commerceQuestions = await r3.json();
        } catch(e) { console.log("Lỗi tải TMĐT", e); }

        // Tải Tiếp thị trực tuyến
        try {
            const r4 = await fetch('questions_marketing.json');
            marketingQuestions = await r4.json();
        } catch(e) { console.log("Lỗi tải Marketing", e); }

        console.log("Đã tải dữ liệu xong");

    } catch (error) {
        console.error("Lỗi tổng:", error);
    }
    
}

// ==============================================
// 3. ĐIỀU HƯỚNG MÀN HÌNH
// ==============================================

// Chọn môn học từ màn hình chính
function selectSubject(subject) {
    currentSubject = subject;
    
    // Ẩn home, hiện start
    homeScreen.classList.add('hide');
    resultBox.classList.add('hide'); // Ẩn kết quả nếu đang ở đó
    startScreen.classList.remove('hide');
    
    if (subject === 'anm') {
        subjectTitle.innerText = "AN NINH MẠNG";
        totalCountSpan.innerText = anmQuestions.length;
        btnMath.classList.remove('hide'); 
    } 
    else if (subject === 'commerce') {
        subjectTitle.innerText = "THƯƠNG MẠI ĐIỆN TỬ";
        totalCountSpan.innerText = commerceQuestions.length;
        btnMath.classList.add('hide');
    }
    // <--- THÊM PHẦN NÀY --->
    else if (subject === 'marketing') {
        subjectTitle.innerText = "TIẾP THỊ TRỰC TUYẾN";
        totalCountSpan.innerText = marketingQuestions.length;
        btnMath.classList.add('hide'); // Môn này không có toán
    }
}

// Quay lại màn hình chính
function goHome() {
    startScreen.classList.add('hide');
    resultBox.classList.add('hide');
    quizBox.classList.add('hide');
    homeScreen.classList.remove('hide');
    if(isMusicOn) bgMusic.pause();
}

// ==============================================
// 4. BẮT ĐẦU QUIZ
// ==============================================
function startQuiz(mode) {
    currentMode = mode;
    startScreen.classList.add('hide');
    quizBox.classList.remove('hide');
    streakBox.classList.add('hide');
    if(isMusicOn) bgMusic.play();

    score = 0; streak = 0;
    currentQuestionIndex = 0;
    wrongAnswers = [];
    blockMistakes = []; blockCount = 0; isRedemptionMode = false;
    
    // --- LẤY DỮ LIỆU TÙY THEO MÔN VÀ CHẾ ĐỘ ---
    let sourceData = [];

    if (currentMode === 'math') {
        // Nếu chọn Toán (Chỉ có ở ANM)
        sourceData = mathQuestions;
    } else {
        // Chọn nguồn theo môn
        if (currentSubject === 'anm') sourceData = anmQuestions;
        else if (currentSubject === 'commerce') sourceData = commerceQuestions;
        else if (currentSubject === 'marketing') sourceData = marketingQuestions;
    }

    // Xáo trộn câu hỏi
    const shuffled = [...sourceData].sort(() => 0.5 - Math.random());

    // Cắt bớt nếu là chế độ Thi thử
    if (currentMode === 'test') {
        currentQuizData = shuffled.slice(0, 75); // Thi thử lấy 75 câu
    } else {
        currentQuizData = shuffled; // Ôn tập lấy hết
    }
    
    setNextQuestion();
}

// ==============================================
// 5. HIỂN THỊ CÂU HỎI
// ==============================================
function setNextQuestion() {
    resetState();
    let questionToShow = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
    
    // --- PHẦN GIAO DIỆN THANH TIẾN ĐỘ ---
    if (isRedemptionMode) {
        mainContainer.classList.add('redemption-theme');
        redemptionAlert.classList.remove('hide');
        progressText.innerText = "GỠ ĐIỂM";
    } else {
        mainContainer.classList.remove('redemption-theme');
        redemptionAlert.classList.add('hide');
        progressText.innerText = `Câu ${currentQuestionIndex + 1}/${currentQuizData.length}`;
        
        let percent = ((currentQuestionIndex) / currentQuizData.length) * 100;
        if (currentMode === 'practice' && currentQuestionIndex > 100) percent = 100;
        progressBar.style.width = `${percent}%`;
    }
    
    scoreText.innerText = `Điểm: ${score}`;
    
    let cleanQuestionText = questionToShow.question.replace(/^(Câu(\s+(hỏi|số))?)?\s*\d+[\.\:\)]?\s*/i, '');

    cleanQuestionText = cleanQuestionText.charAt(0).toUpperCase() + cleanQuestionText.slice(1);

    questionElement.innerText = cleanQuestionText;

    if (window.MathJax) MathJax.typesetPromise();
    let answersToRender = questionToShow.options.map((opt, i) => {
        return { text: opt, originIndex: i };
    });

    answersToRender.sort(() => Math.random() - 0.5);

    answersToRender.forEach((item) => {
        const button = document.createElement('button');
        button.innerText = item.text.replace(/^[A-Da-d][\.\)]\s*/, ''); 
        
        button.classList.add('btn');
        if (item.originIndex === questionToShow.answer) {
            button.dataset.correct = "true";
        }
        button.addEventListener('click', (e) => selectAnswer(e, questionToShow));
        answerButtonsElement.appendChild(button);
    });

    if (window.MathJax) {
        MathJax.typesetPromise([quizBox]).then(() => { console.log("MathJax rendered!"); });
    }
}

function resetState() {
    nextButton.classList.add('hide');
    explanationBox.classList.add('hide');
    explanationBox.innerHTML = "";
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// ==============================================
// 6. XỬ LÝ TRẢ LỜI
// ==============================================
function selectAnswer(e, questionData) {
    const selectedButton = e.target;
    const isCorrect = selectedButton.dataset.correct === "true";
    
    if (isCorrect) {
        if(isSfxOn) { correctSound.currentTime=0; correctSound.play(); }
        score++; streak++;
        if(streak % 5 === 0 && isStreakOn && typeof confetti === 'function') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        if(isRedemptionMode) wrongAnswers = wrongAnswers.filter(q => q.question !== questionData.question);
    } else {
        if(isSfxOn) { wrongSound.currentTime=0; wrongSound.play(); }
        streak = 0;
        if(!isRedemptionMode) {
            wrongAnswers.push({
                question: questionData.question,
                correctAnswer: questionData.options[questionData.answer],
                userAnswer: selectedButton.innerText,
                explanation: questionData.explanation
            });
            if(currentMode !== 'test') blockMistakes.push(questionData);
        }
    }
    
    // Hiện giải thích (nếu có)
    if (questionData.explanation && questionData.explanation.trim() !== "") {
        explanationBox.innerHTML = `<strong>💡 Giải thích:</strong><br>${questionData.explanation}`;
        explanationBox.classList.remove('hide');
        if (window.MathJax) MathJax.typesetPromise([explanationBox]);
    }

    updateStreakDisplay();
    scoreText.innerText = `Điểm: ${score}`;

    Array.from(answerButtonsElement.children).forEach(button => {
        button.classList.remove('correct', 'wrong', 'dim');
        if (button.dataset.correct === "true") button.classList.add('correct');
        else if (button === selectedButton && !isCorrect) button.classList.add('wrong');
        else button.classList.add('dim');
        button.disabled = true;
    });
    nextButton.classList.remove('hide');
}

function updateStreakDisplay() {
    streakCountSpan.innerText = streak;
    if(streak > 2 && isStreakOn) streakBox.classList.remove('hide');
    else streakBox.classList.add('hide');
}

// ==============================================
// 7. CHUYỂN CÂU & KẾT QUẢ
// ==============================================
function handleNextButton() {
    if (isRedemptionMode) {
        isRedemptionMode = false; redemptionQuestion = null;
        setNextQuestion();
        return;
    }

    currentQuestionIndex++;
    
    // Logic gỡ điểm (Mỗi 10 câu practice)
    if (currentMode !== 'test') {
        blockCount++;
        if (blockCount === 10) {
            blockCount = 0;
            if (blockMistakes.length > 0) {
                const randomIndex = Math.floor(Math.random() * blockMistakes.length);
                redemptionQuestion = blockMistakes[randomIndex];
                isRedemptionMode = true;
                blockMistakes = [];
                setNextQuestion();
                return;
            }
        }
    }
    
    if (currentQuestionIndex < currentQuizData.length) {
        setNextQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    quizBox.classList.add('hide');
    resultBox.classList.remove('hide');
    streakBox.classList.add('hide');
    if(isMusicOn) bgMusic.pause();
    
    document.getElementById('final-score').innerText = `${score} / ${currentQuizData.length}`;

    // --- CODE MỚI: LƯU ĐIỂM VÀ VẼ BIỂU ĐỒ ---
    saveScoreToHistory();
    drawScoreChart();
    // ----------------------------------------

    // ... (Phần hiển thị câu sai review cũ giữ nguyên) ...
    if (wrongAnswers.length > 0) {
        reviewContainer.classList.remove('hide');
        // ... (code render list cũ) ...
        reviewList.innerHTML = "";
        wrongAnswers.forEach((item, index) => {
            // ... (code tạo div cũ) ...
             const div = document.createElement('div');
            div.classList.add('review-item');
            let explanationHTML = item.explanation ? `<div class="explanation-text">💡 ${item.explanation}</div>` : "";
            div.innerHTML = `
                <p><strong>Câu ${index + 1}:</strong> ${item.question}</p>
                <p class="user-ans">❌ Chọn: ${item.userAnswer}</p>
                <p class="correct-ans">✅ Đáp án: ${item.correctAnswer}</p>
                ${explanationHTML}
            `;
            reviewList.appendChild(div);
        });
        if (window.MathJax) MathJax.typesetPromise([reviewList]);
    } else {
        reviewContainer.classList.add('hide');
    }
}

// Hàm lưu điểm vào LocalStorage
function saveScoreToHistory() {
    // Nếu chưa có lịch sử môn này thì tạo mảng mới
    if (!scoreHistory[currentSubject]) scoreHistory[currentSubject] = [];
    
    // Chỉ lưu điểm của chế độ Thi thử hoặc Ôn tập (không lưu chế độ Math/Saved để biểu đồ chuẩn hơn)
    if (currentMode === 'practice' || currentMode === 'test') {
        const date = new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        const percent = Math.round((score / currentQuizData.length) * 100);
        
        scoreHistory[currentSubject].push({ date: date, score: percent });
        
        // Chỉ giữ lại 10 lần thi gần nhất
        if (scoreHistory[currentSubject].length > 10) {
            scoreHistory[currentSubject].shift();
        }
        
        localStorage.setItem('quiz_history', JSON.stringify(scoreHistory));
    }
}

// Hàm vẽ biểu đồ
function drawScoreChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    // Hủy biểu đồ cũ nếu có để vẽ cái mới
    if (scoreChart) scoreChart.destroy();
    
    const data = scoreHistory[currentSubject] || [];
    const labels = data.map((d, i) => `Lần ${i+1} (${d.date})`);
    const scores = data.map(d => d.score);

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Tiến độ môn ${currentSubject === 'anm' ? 'ANM' : (currentSubject === 'commerce' ? 'TMĐT' : 'Tiếp Thị')}`,
                data: scores,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderWidth: 3,
                tension: 0.3, // Đường cong mềm mại
                fill: true,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Điểm (%)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } } // Chữ màu trắng nếu nền tối
            }
        }
    });
}

// Cài đặt Toggle
function toggleSettings() { settingsModal.classList.toggle('hide'); }
if(toggleSfxBtn) toggleSfxBtn.addEventListener('change', (e) => isSfxOn = e.target.checked);
if(toggleStreakBtn) toggleStreakBtn.addEventListener('change', (e) => { isStreakOn = e.target.checked; updateStreakDisplay(); });
if(toggleBgmBtn) toggleBgmBtn.addEventListener('change', (e) => {
    isMusicOn = e.target.checked;
    isMusicOn ? bgMusic.play().catch(e=>console.log(e)) : bgMusic.pause();
});

// ==============================================
// TÍNH NĂNG 2: PHÍM TẮT (1,2,3,4/A,B,C,D & Enter/Space)
// ==============================================
document.addEventListener('keydown', (e) => {
    // Chỉ hoạt động khi đang làm bài
    if (quizBox.classList.contains('hide')) return;

    const options = document.querySelectorAll('#options-container .btn');
    const key = e.key.toLowerCase(); 

    // 1. Chọn đáp án (Số 1-4 hoặc Chữ A-D)
    if ((key === '1' || key === 'a') && options[0]) options[0].click();
    if ((key === '2' || key === 'b') && options[1]) options[1].click();
    if ((key === '3' || key === 'c') && options[2]) options[2].click();
    if ((key === '4' || key === 'd') && options[3]) options[3].click();

    // 2. Chuyển câu (Enter hoặc Space)
    // Lưu ý: key === ' ' nghĩa là phím Space
    if ((key === 'enter' || key === ' ') && !nextButton.classList.contains('hide')) {
        e.preventDefault(); // Dòng này QUAN TRỌNG: Ngăn trang web bị trôi xuống khi bấm Space
        handleNextButton();
    }
});
// ==============================================
// BẢO VỆ NỘI DUNG (CHỐNG COPY)
// ==============================================

// 1. Chặn menu chuột phải (Right Click)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // alert("Chức năng này đã bị tắt!"); // Có thể bật dòng này nếu muốn thông báo
});

// 2. Chặn các phím tắt sao chép và soi code
document.addEventListener('keydown', (e) => {
    // Chặn F12 (Developer Tools)
    if (e.key === 'F12') {
        e.preventDefault();
        return;
    }

    // Chặn các tổ hợp phím với Ctrl (hoặc Cmd trên Mac)
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'c': // Chặn Copy (Ctrl+C)
            case 'x': // Chặn Cut (Ctrl+X)
            case 'u': // Chặn View Source (Ctrl+U)
            case 's': // Chặn Save (Ctrl+S)
            case 'p': // Chặn Print (Ctrl+P)
            case 'a': // Chặn Select All (Ctrl+A)
                e.preventDefault();
                alert("Định copy tra chatgpt à!"); 
                break;
        }
    }
});
// KHỞI CHẠY
loadAllData();



