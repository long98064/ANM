// ==============================================
// 1. KHAI BÁO BIẾN
// ==============================================
// Dữ liệu các môn
let anmQuestions = [];
let mathQuestions = [];
let commerceQuestions = [];
let marketingQuestions = [];

// Biến trạng thái hiện tại
let currentSubject = ''; 
let currentQuizData = []; 
let currentQuestionIndex = 0;
let score = 0;
let wrongAnswers = []; 

// ==============================================
// XỬ LÝ CẢM ỨNG (TOUCH EVENTS) CHO MOBILE
// ==============================================
let activeTouchItem = null; // Ô đang được chạm
let touchOffsetX = 0;
let touchOffsetY = 0;
let originalTouchStyle = {}; // Lưu style cũ để khôi phục nếu thả trượt

// Biến cho tính năng Bấm-để-Nối (Tap-to-Match)
let firstSelectedItem = null; // Lưu ô đầu tiên được bấm

// Tính năng phụ
let streak = 0;
let currentMode = 'practice';
let isRedemptionMode = false;
let redemptionQuestion = null;
let blockMistakes = []; 
let blockCount = 0;

// Biến cho phần Kéo thả (Drag & Drop)
let draggedItem = null;
let matchedCount = 0;

// Cài đặt
let isSfxOn = true;
let isMusicOn = false;
let isStreakOn = true;

let scoreHistory = JSON.parse(localStorage.getItem('quiz_history')) || {}; 
let scoreChart = null; 
let timerInterval;

const timerBox = document.getElementById('timer-box');
const timeLeftSpan = document.getElementById('time-left');
const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');
const bgMusic = document.getElementById('bg-music');
if(bgMusic) bgMusic.volume = 0.3;

// DOM Elements
const homeScreen = document.getElementById('home-screen'); 
const startScreen = document.getElementById('start-screen'); 
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
// 2. TẢI DỮ LIỆU
// ==============================================
async function loadAllData() {
    try {
        try { const r1 = await fetch('questions.json'); anmQuestions = await r1.json(); } catch(e) {}
        try { const r2 = await fetch('questions_math.json'); mathQuestions = await r2.json(); } catch(e) {}
        try { const r3 = await fetch('questions_commerce.json'); commerceQuestions = await r3.json(); } catch(e) {}
        try { const r4 = await fetch('questions_marketing.json'); marketingQuestions = await r4.json(); } catch(e) {}
        console.log("Đã tải dữ liệu xong");
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
}

// ==============================================
// 3. ĐIỀU HƯỚNG MÀN HÌNH
// ==============================================
function selectSubject(subject) {
    currentSubject = subject;
    homeScreen.classList.add('hide');
    resultBox.classList.add('hide');
    startScreen.classList.remove('hide');
    
    if (subject === 'anm') {
        subjectTitle.innerText = "AN NINH MẠNG";
        totalCountSpan.innerText = anmQuestions.length;
        btnMath.classList.add('hide'); 
    } else if (subject === 'commerce') {
        subjectTitle.innerText = "THƯƠNG MẠI ĐIỆN TỬ";
        totalCountSpan.innerText = commerceQuestions.length;
        btnMath.classList.add('hide');
    } else if (subject === 'marketing') {
        subjectTitle.innerText = "TIẾP THỊ TRỰC TUYẾN";
        totalCountSpan.innerText = marketingQuestions.length;
        btnMath.classList.add('hide');
    }
}

function goHome() {
    startScreen.classList.add('hide');
    resultBox.classList.add('hide');
    quizBox.classList.add('hide');
    homeScreen.classList.remove('hide');
    if(isMusicOn) bgMusic.pause();
    stopTimer();
}

// ==============================================
// 4. BẮT ĐẦU QUIZ (CẬP NHẬT LOGIC TRỘN ĐỀ)
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
    
    // 1. Xác định nguồn dữ liệu môn chính
    let mainSubjectData = [];
    if (currentSubject === 'anm') mainSubjectData = anmQuestions;
    else if (currentSubject === 'commerce') mainSubjectData = commerceQuestions;
    else if (currentSubject === 'marketing') mainSubjectData = marketingQuestions;

    // Kiểm tra dữ liệu
    if ((!mainSubjectData || mainSubjectData.length === 0) && currentMode !== 'math') {
        alert("Chưa có dữ liệu câu hỏi!");
        goHome();
        return;
    }

    if (currentMode === 'math') {
        // Nếu lỡ bấm vào mode math thì vẫn cho chạy (hoặc có thể chặn luôn ở đây)
        currentQuizData = [...mathQuestions].sort(() => 0.5 - Math.random());
        timerBox.classList.add('hide');
    } 
    else if (currentMode === 'test') {
        // --- CẤU HÌNH THI THỬ (70 CÂU) ---
        const totalReq = 70; 
        const timeLimit = 40; 
        
        // --- CHỈNH SỬA TẠI ĐÂY: XÓA TOÁN ---
        const reqMath = 0; // Đặt về 0
        const reqDrag = 3;
        const reqText = 3;
        
        // A. Lấy Toán (Mảng rỗng)
        let selectedMath = []; 

        // B. Phân loại câu hỏi từ Môn chính
        let dragPool = mainSubjectData.filter(q => q.type === 'drag');
        let textPool = mainSubjectData.filter(q => q.type === 'text');
        let choicePool = mainSubjectData.filter(q => q.type !== 'drag' && q.type !== 'text');

        dragPool.sort(() => 0.5 - Math.random());
        textPool.sort(() => 0.5 - Math.random());
        choicePool.sort(() => 0.5 - Math.random());

        // C. Lấy câu hỏi đặc biệt
        let selectedDrag = dragPool.slice(0, reqDrag);
        let selectedText = textPool.slice(0, reqText);

        // D. Tự động lấy trắc nghiệm bù vào cho đủ 70 câu
        // Lúc này nó sẽ lấy: 70 - 0 - 3 - 3 = 64 câu trắc nghiệm
        let currentCount = selectedMath.length + selectedDrag.length + selectedText.length;
        let neededChoice = totalReq - currentCount;
        
        let selectedChoice = choicePool.slice(0, neededChoice);

        // E. Gộp và trộn
        currentQuizData = [
            ...selectedMath, // Rỗng
            ...selectedDrag, 
            ...selectedText, 
            ...selectedChoice
        ].sort(() => 0.5 - Math.random());
        
        startTimer(timeLimit);
    } 
    else {
        // Chế độ Ôn tập (Practice)
        currentQuizData = [...mainSubjectData].sort(() => 0.5 - Math.random());
        timerBox.classList.add('hide');
    }
    
    window.currentDragStatus = []; 
    setNextQuestion();
}

// ==============================================
// 5. HIỂN THỊ CÂU HỎI & RENDER
// ==============================================
function setNextQuestion() {
    resetState();
    
    // Kiểm tra dữ liệu an toàn
    if (!currentQuizData || currentQuizData.length === 0) return;

    let q = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
    if (!q) { showResult(); return; }

    // --- GIAO DIỆN THANH TIẾN ĐỘ ---
    if (isRedemptionMode) {
        mainContainer.classList.add('redemption-theme');
        redemptionAlert.classList.remove('hide');
        progressText.innerText = "GỠ ĐIỂM";
    } else {
        mainContainer.classList.remove('redemption-theme');
        redemptionAlert.classList.add('hide');
        progressText.innerText = `Câu ${currentQuestionIndex + 1}/${currentQuizData.length}`;
        let percent = ((currentQuestionIndex) / currentQuizData.length) * 100;
        progressBar.style.width = `${percent}%`;
    }
    scoreText.innerText = `Điểm: ${score}`;

    // --- HIỂN THỊ TEXT CÂU HỎI ---
    let cleanText = q.question.replace(/^(Câu(\s+(hỏi|số))?)?\s*\d+[\.\:\)]?\s*/i, '');
    questionElement.innerText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

    // --- QUAN TRỌNG: RESET GIAO DIỆN VỀ MẶC ĐỊNH ---
    // Dòng này giúp các câu trắc nghiệm sau đó không bị dài thượt
    answerButtonsElement.style.display = ""; 
    answerButtonsElement.style.gridTemplateColumns = ""; 

    // --- PHÂN LOẠI HIỂN THỊ ---
    const type = q.type || "choice";

    if (type === "choice") {
        // Trắc nghiệm (Dùng Grid mặc định của CSS)
        renderMultipleChoice(q);
    } else {
        // Các dạng khác (Ép sang Block để rộng chỗ)
        answerButtonsElement.style.display = "block";
        
        if (type === "text") {
            if (typeof renderTextInput === "function") renderTextInput(q);
        } else if (type === "drag") {
            if (typeof renderDragDrop === "function") renderDragDrop(q);
        }
    }

    // MathJax chạy cuối cùng
    if (window.MathJax) MathJax.typesetPromise([quizBox]);
}
// --- HÀM RENDER TRẮC NGHIỆM (TÁCH RA TỪ LOGIC CŨ) ---
function renderMultipleChoice(q) {
    let answersToRender = q.options.map((opt, i) => {
        return { text: opt, originIndex: i };
    });

    answersToRender.sort(() => Math.random() - 0.5);

    answersToRender.forEach((item) => {
        const button = document.createElement('button');
        // Xóa ký tự A. B. C. D. ở đầu nếu có
        button.innerText = item.text.replace(/^[A-Da-d][\.\)]\s*/, ''); 
        
        button.classList.add('btn');
        if (item.originIndex === q.answer) {
            button.dataset.correct = "true";
        }
        button.addEventListener('click', (e) => selectAnswer(e, q));
        answerButtonsElement.appendChild(button);
    });
}

function resetState() {
    nextButton.classList.add('hide');
    explanationBox.classList.add('hide');
    explanationBox.innerHTML = "";
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

// --- RENDER 1: TRẮC NGHIỆM (CHOICE) ---
function renderMultipleChoice(q) {
    let answersToRender = q.options.map((opt, i) => { return { text: opt, originIndex: i }; });
    answersToRender.sort(() => Math.random() - 0.5);

    answersToRender.forEach((item) => {
        const button = document.createElement('button');
        button.innerText = item.text.replace(/^[A-Da-d][\.\)]\s*/, ''); 
        button.classList.add('btn');
        if (item.originIndex === q.answer) button.dataset.correct = "true";
        
        button.addEventListener('click', (e) => selectAnswerChoice(e, q));
        answerButtonsElement.appendChild(button);
    });
}

// --- RENDER 2: ĐIỀN TỪ (TEXT INPUT) ---

function renderTextInput(q) {
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    
    // 1. Dòng nhập liệu (Input + Check + Hint)
    const rowContainer = document.createElement('div');
    rowContainer.style.display = 'flex';
    rowContainer.style.width = '100%'; 
    rowContainer.style.gap = '10px';
    rowContainer.style.justifyContent = 'space-between';

    // Ô nhập
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Nhập đáp án...";
    input.classList.add('input-answer-field');
    input.autocomplete = "off";
    input.style.flex = "1"; 
    input.style.padding = "12px 15px";
    input.style.fontSize = "1.1rem";
    input.style.border = "2px solid #374151"; // Viền tối màu hơn cho hợp theme
    input.style.backgroundColor = "#1f2937"; // Nền tối
    input.style.color = "#fff";
    input.style.borderRadius = "8px";

    // Nút Kiểm tra
    const btnCheck = document.createElement('button');
    btnCheck.innerText = "Kiểm tra";
    btnCheck.classList.add('btn-check'); 
    btnCheck.style.whiteSpace = "nowrap";

    // Nút Gợi ý (Nếu có)
    let btnHint = null;
    let hintText = null;
    if (q.hint && q.hint.trim() !== "") {
        btnHint = document.createElement('button');
        btnHint.innerHTML = "💡";
        btnHint.title = "Gợi ý";
        btnHint.classList.add('btn-hint'); // Bạn nhớ kiểm tra class btn-hint trong css nhé
        
        hintText = document.createElement('div');
        hintText.classList.add('hint-content', 'hide');
        hintText.innerText = "Gợi ý: " + q.hint;
        // Style nhanh cho hint text
        hintText.style.marginTop = "10px";
        hintText.style.padding = "10px";
        hintText.style.background = "#fff3cd";
        hintText.style.color = "#856404";
        hintText.style.borderRadius = "5px";

        btnHint.addEventListener('click', () => hintText.classList.remove('hide'));
    }

    rowContainer.appendChild(input);
    rowContainer.appendChild(btnCheck);
    if (btnHint) rowContainer.appendChild(btnHint);

    // -----------------------------------------------------------
    // 2. NÚT BỎ QUA (ĐÃ ĐƯỢC LÀM ĐẸP)
    // -----------------------------------------------------------
    const btnSkip = document.createElement('button');
    btnSkip.innerText = "Không biết? Bỏ qua câu này"; // Bỏ icon ở đây vì CSS đã có ::after
    btnSkip.className = 'btn-skip'; // <--- Dùng class mới tạo ở bước 1
    
    // Ghép vào wrapper
    wrapper.appendChild(rowContainer);
    if (hintText) wrapper.appendChild(hintText);
    
    // Thêm một div bao ngoài nút skip để căn trái/phải tùy ý (ở đây mình để căn trái)
    const skipContainer = document.createElement('div');
    skipContainer.style.display = 'flex';
    skipContainer.style.justifyContent = 'flex-start'; // Căn trái
    skipContainer.appendChild(btnSkip);
    
    wrapper.appendChild(skipContainer);

    // --- LOGIC ---
    btnCheck.addEventListener('click', () => {
        const userVal = input.value.trim().toLowerCase();
        const correctVal = q.correctAnswer.toString().toLowerCase();
        
        if (userVal === correctVal) {
            // Đúng
            input.style.borderColor = "#2ecc71";
            input.style.backgroundColor = "#d4edda"; // Màu xanh nhạt
            input.style.color = "#155724"; // Chữ xanh đậm
            
            btnCheck.innerText = "Đúng!";
            btnCheck.disabled = true;
            input.disabled = true;
            if(btnHint) btnHint.disabled = true;
            
            // Ẩn nút skip đi cho gọn
            skipContainer.style.display = "none";
            
            if(hintText) hintText.classList.add('hide');
            handleCorrectAnswer(); 
        } else {
            // Sai
            input.style.borderColor = "#e74c3c";
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    });

    btnSkip.addEventListener('click', () => {
        handleWrongAnswer(q, input.value || "Bỏ qua");
        handleNextButton(); 
    });

    answerButtonsElement.appendChild(wrapper);
}
// --- RENDER 3: KÉO THẢ (DRAG & DROP) ---
// ============================================================
// --- RENDER 3: KÉO THẢ & BẤM NỐI (DRAG & TAP TO MATCH) ---
function renderDragDrop(q) {
    window.currentDragStatus = []; 
    // Reset biến chọn mỗi khi render câu mới
    firstSelectedItem = null; 

    try {
        // Ép giao diện Block
        if(answerButtonsElement) {
            answerButtonsElement.style.display = "block";
            answerButtonsElement.style.gridTemplateColumns = "none";
        }

        matchedCount = 0;
        const container = document.createElement('div');
        container.classList.add('drag-container');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.gap = '15px'; 
        container.style.width = '100%';
        container.style.marginTop = '20px';

        const colLeft = document.createElement('div');
        colLeft.style.flex = '1'; colLeft.style.display='flex'; colLeft.style.flexDirection='column'; colLeft.style.gap='15px';
        
        const colRight = document.createElement('div');
        colRight.style.flex = '1'; colRight.style.display='flex'; colRight.style.flexDirection='column'; colRight.style.gap='15px';

        if (!q.pairs) { alert("Lỗi: Thiếu dữ liệu nối!"); return; }

        const shuffledPairs = [...q.pairs].sort(() => Math.random() - 0.5);

        // --- CỘT TRÁI ---
        q.pairs.forEach(pair => {
            const box = document.createElement('div');
            box.className = 'drop-zone match-item'; // Thêm class match-item để dễ xử lý
            box.innerText = pair.left;
            box.dataset.id = pair.id; 
            box.dataset.type = 'left'; // Đánh dấu đây là cột trái
            
            // Style
            box.style.padding = '15px';
            box.style.border = '2px dashed #95a5a6';
            box.style.borderRadius = '8px';
            box.style.background = '#ffffff';
            box.style.color = '#333333';
            box.style.minHeight = '60px';
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.textAlign = 'center';
            box.style.fontWeight = 'bold';
            box.style.cursor = 'pointer'; // Con trỏ tay
            box.style.userSelect = 'none'; // Chống bôi đen text khi bấm nhanh

            // Sự kiện Drag cho PC (giữ lại nếu thích)
            box.addEventListener('dragover', e => { e.preventDefault(); box.style.borderColor = '#e74c3c'; });
            box.addEventListener('dragleave', () => box.style.borderColor = '#95a5a6');
            box.addEventListener('drop', handleDrop);
            
            // --- SỰ KIỆN CLICK (CHO CẢ MOBILE & PC) ---
            box.addEventListener('click', handleItemClick);
            
            colLeft.appendChild(box);
        });

        // --- CỘT PHẢI ---
        shuffledPairs.forEach(pair => {
            const item = document.createElement('div');
            item.className = 'draggable-item match-item';
            item.innerText = pair.right;
            item.draggable = true;
            item.dataset.id = pair.id; 
            item.dataset.type = 'right'; // Đánh dấu đây là cột phải

            // Style
            item.style.padding = '15px';
            item.style.border = '1px solid #3498db';
            item.style.borderRadius = '8px';
            item.style.background = '#ecf0f1';
            item.style.color = '#333333';
            item.style.minHeight = '60px';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
            item.style.textAlign = 'center';
            item.style.userSelect = 'none';

            // Sự kiện Drag cho PC
            item.addEventListener('dragstart', () => { draggedItem = item; });
            item.addEventListener('dragend', () => { draggedItem = null; });

            // --- SỰ KIỆN CLICK (CHO CẢ MOBILE & PC) ---
            item.addEventListener('click', handleItemClick);
            
            colRight.appendChild(item);
        });

        container.appendChild(colLeft);
        container.appendChild(colRight);
        answerButtonsElement.appendChild(container);

    } catch (err) {
        console.error(err);
    }
}

// --- XỬ LÝ SỰ KIỆN THẢ (DROP) - UPDATED ---
// --- XỬ LÝ KÉO THẢ CHUỘT (PC) ---
function handleDrop(e) {
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone || !draggedItem) return;

    // Gọi chung hàm logic với tính năng bấm
    checkMatchLogic(dropZone, draggedItem);
    
    // Reset hiệu ứng hover
    dropZone.style.borderColor = '#95a5a6';
}

// ==============================================
// 6. XỬ LÝ ĐÚNG / SAI (SHARED LOGIC)
// ==============================================

function selectAnswerChoice(e, questionData) {
    const selectedButton = e.target;
    const isCorrect = selectedButton.dataset.correct === "true";
    
    // 1. Xử lý logic điểm số
    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer(questionData, selectedButton.innerText);
    }
    
    // 2. Giao diện (Tô màu xanh/đỏ các nút)
    Array.from(answerButtonsElement.children).forEach(button => {
        button.classList.remove('correct', 'wrong', 'dim');
        if (button.dataset.correct === "true") button.classList.add('correct');
        else if (button === selectedButton && !isCorrect) button.classList.add('wrong');
        else button.classList.add('dim');
        button.disabled = true; 
    });

    // 3. Hiện giải thích
    if (questionData.explanation && questionData.explanation.trim() !== "") {
        explanationBox.innerHTML = `<strong>💡 Giải thích:</strong><br>${questionData.explanation}`;
        explanationBox.classList.remove('hide');
        if (window.MathJax) MathJax.typesetPromise([explanationBox]);
    }

    // 4. Hiện nút Next
    nextButton.classList.remove('hide'); 
}

function handleCorrectAnswer() {
    if(isSfxOn) { correctSound.currentTime=0; correctSound.play(); }
    score++; streak++;
    
    if(streak % 5 === 0 && isStreakOn && typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    
    if(isRedemptionMode && redemptionQuestion) {
        wrongAnswers = wrongAnswers.filter(q => q.question !== redemptionQuestion.question);
    }

    updateStreakDisplay();
    scoreText.innerText = `Điểm: ${score}`;
    
    let q = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
    if (q.explanation) {
        explanationBox.innerHTML = `<strong>💡 Giải thích:</strong><br>${q.explanation}`;
        explanationBox.classList.remove('hide');
        if (window.MathJax) MathJax.typesetPromise([explanationBox]);
    }

    nextButton.classList.remove('hide');
}

function handleWrongAnswer(q, userAns) {
    if(isSfxOn) { wrongSound.currentTime=0; wrongSound.play(); }
    streak = 0;
    
    if(!isRedemptionMode) {
        let correctAnsText = q.type === 'text' ? q.correctAnswer : (q.type==='choice' ? q.options[q.answer] : "Xem lại bài");
        
        wrongAnswers.push({
            question: q.question,
            correctAnswer: correctAnsText,
            userAnswer: userAns,
            explanation: q.explanation
        });
        if(currentMode !== 'test') blockMistakes.push(q);
    }
    updateStreakDisplay();
    scoreText.innerText = `Điểm: ${score}`;
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
    stopTimer();
    if(isMusicOn) bgMusic.pause();
    
    document.getElementById('final-score').innerText = `${score} / ${currentQuizData.length}`;

    saveScoreToHistory();
    drawScoreChart();

    if (wrongAnswers.length > 0) {
        reviewContainer.classList.remove('hide');
        reviewList.innerHTML = "";
        wrongAnswers.forEach((item, index) => {
             const div = document.createElement('div');
            div.classList.add('review-item');
            let explanationHTML = item.explanation ? `<div class="explanation-text">💡 ${item.explanation}</div>` : "";
            div.innerHTML = `
                <p><strong>Câu ${index + 1}:</strong> ${item.question}</p>
                <p class="user-ans">❌ Bạn chọn: ${item.userAnswer}</p>
                <p class="correct-ans">✅ Đáp án đúng: ${item.correctAnswer}</p>
                ${explanationHTML}
            `;
            reviewList.appendChild(div);
        });
        if (window.MathJax) MathJax.typesetPromise([reviewList]);
    } else {
        reviewContainer.classList.add('hide');
    }
}

// ==============================================
// 8. CÁC HÀM TIỆN ÍCH
// ==============================================
function startTimer(minutes) {
    let seconds = minutes * 60;
    timerBox.classList.remove('hide');
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timeLeftSpan.innerText = `${m}:${s}`;
        
        if (seconds < 300) timerBox.classList.add('time-warning');
        else timerBox.classList.remove('time-warning');

        if (seconds <= 0) {
            clearInterval(timerInterval);
            alert("⏰ ĐÃ HẾT GIỜ LÀM BÀI!");
            showResult(); 
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerBox.classList.add('hide');
    timerBox.classList.remove('time-warning');
}

function saveScoreToHistory() {
    if (!scoreHistory[currentSubject]) scoreHistory[currentSubject] = [];
    if (currentMode === 'practice' || currentMode === 'test') {
        const date = new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        const percent = Math.round((score / currentQuizData.length) * 100);
        scoreHistory[currentSubject].push({ date: date, score: percent });
        if (scoreHistory[currentSubject].length > 10) scoreHistory[currentSubject].shift();
        localStorage.setItem('quiz_history', JSON.stringify(scoreHistory));
    }
}

function drawScoreChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    if (scoreChart) scoreChart.destroy();
    
    const data = scoreHistory[currentSubject] || [];
    const labels = data.map((d, i) => `Lần ${i+1}`);
    const scores = data.map(d => d.score);

    scoreChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Tiến độ (%)`,
                data: scores,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function toggleSettings() { settingsModal.classList.toggle('hide'); }
if(toggleSfxBtn) toggleSfxBtn.addEventListener('change', (e) => isSfxOn = e.target.checked);
if(toggleStreakBtn) toggleStreakBtn.addEventListener('change', (e) => { isStreakOn = e.target.checked; updateStreakDisplay(); });
if(toggleBgmBtn) toggleBgmBtn.addEventListener('change', (e) => {
    isMusicOn = e.target.checked;
    isMusicOn ? bgMusic.play().catch(e=>{}) : bgMusic.pause();
});

document.addEventListener('keydown', (e) => {
    if (quizBox.classList.contains('hide')) return;
    const options = document.querySelectorAll('#options-container .btn');
    const key = e.key.toLowerCase(); 

    if(document.querySelector('.input-answer-field')) return;

    if ((key === '1' || key === 'a') && options[0]) options[0].click();
    if ((key === '2' || key === 'b') && options[1]) options[1].click();
    if ((key === '3' || key === 'c') && options[2]) options[2].click();
    if ((key === '4' || key === 'd') && options[3]) options[3].click();

    if ((key === 'enter' || key === ' ') && !nextButton.classList.contains('hide')) {
        e.preventDefault(); 
        handleNextButton();
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && ['c','x','u','s','p','a'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
    }
});

// ==============================================
// 9. BỔ SUNG CÁC HÀM CẢM ỨNG CÒN THIẾU
// ==============================================

function handleTouchStart(e) {
    const targetItem = e.target.closest('.draggable-item');
    if (!targetItem) return; 

    if(e.cancelable) e.preventDefault(); 
    
    const touch = e.touches[0];
    activeTouchItem = targetItem;
    draggedItem = activeTouchItem; 

    const rect = activeTouchItem.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    originalTouchStyle = {
        position: activeTouchItem.style.position,
        left: activeTouchItem.style.left,
        top: activeTouchItem.style.top,
        zIndex: activeTouchItem.style.zIndex,
        width: activeTouchItem.style.width,
        opacity: activeTouchItem.style.opacity
    };

    activeTouchItem.style.position = 'fixed';
    activeTouchItem.style.zIndex = '9999';
    activeTouchItem.style.width = rect.width + 'px'; 
    activeTouchItem.style.left = (rect.left) + 'px';
    activeTouchItem.style.top = (rect.top) + 'px';
    activeTouchItem.style.opacity = '0.8';
    activeTouchItem.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
}

function handleTouchMove(e) {
    if (!activeTouchItem) return;
    if(e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    activeTouchItem.style.left = (touch.clientX - touchOffsetX) + 'px';
    activeTouchItem.style.top = (touch.clientY - touchOffsetY) + 'px';
}

function handleTouchEnd(e) {
    if (!activeTouchItem) return;

    const touch = e.changedTouches[0];
    
    activeTouchItem.style.display = 'none';
    let targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    activeTouchItem.style.display = 'flex';

    let dropZone = targetElement ? targetElement.closest('.drop-zone') : null;

    if (dropZone) {
        const fakeEvent = { target: dropZone };
        handleDrop(fakeEvent);
    } else {
        resetTouchItem();
    }

    activeTouchItem = null;
    draggedItem = null;
}

function resetTouchItem() {
    if (activeTouchItem) {
        activeTouchItem.style.position = originalTouchStyle.position;
        activeTouchItem.style.left = originalTouchStyle.left;
        activeTouchItem.style.top = originalTouchStyle.top;
        activeTouchItem.style.zIndex = originalTouchStyle.zIndex;
        activeTouchItem.style.width = originalTouchStyle.width;
        activeTouchItem.style.opacity = originalTouchStyle.opacity;
        activeTouchItem.style.boxShadow = 'none';
    }
}
// ==============================================
// XỬ LÝ BẤM ĐỂ NỐI (TAP TO MATCH)
// ==============================================
function handleItemClick(e) {
    // 1. Lấy ô vừa bấm
    // Dùng closest để chắc chắn lấy đúng thẻ div dù bấm vào chữ bên trong
    const clickedItem = e.target.closest('.match-item');
    
    // Nếu ô này đã được nối đúng rồi thì bỏ qua
    if (!clickedItem || clickedItem.classList.contains('correct-match')) return;

    // 2. Nếu chưa chọn ô nào (Lần bấm thứ 1)
    if (!firstSelectedItem) {
        firstSelectedItem = clickedItem;
        firstSelectedItem.classList.add('selected-item'); // Thêm viền vàng
        return;
    }

    // 3. Nếu bấm lại vào chính ô đang chọn -> Hủy chọn
    if (clickedItem === firstSelectedItem) {
        firstSelectedItem.classList.remove('selected-item');
        firstSelectedItem = null;
        return;
    }

    // 4. Nếu bấm vào ô cùng một phía (VD: Trái rồi lại bấm Trái) -> Đổi sang chọn ô mới
    if (clickedItem.dataset.type === firstSelectedItem.dataset.type) {
        firstSelectedItem.classList.remove('selected-item'); // Bỏ chọn cái cũ
        firstSelectedItem = clickedItem;
        firstSelectedItem.classList.add('selected-item'); // Chọn cái mới
        return;
    }

    // 5. Nếu bấm vào 2 phía khác nhau (1 Trái + 1 Phải) -> TIẾN HÀNH KIỂM TRA
    // Gọi hàm checkMatchLogic để xử lý giống hệt như khi kéo thả
    checkMatchLogic(firstSelectedItem, clickedItem);

    // Reset sau khi kiểm tra xong
    firstSelectedItem.classList.remove('selected-item');
    firstSelectedItem = null;
}

// Hàm kiểm tra ghép đôi (Tách ra từ handleDrop để dùng chung)
function checkMatchLogic(item1, item2) {
    // Xác định đâu là dropZone (cột trái) và item (cột phải) để tái sử dụng style cũ
    // Tuy nhiên logic so sánh chỉ cần ID
    const id1 = item1.dataset.id;
    const id2 = item2.dataset.id;

    // --- CHẾ ĐỘ THI THỬ ---
    if (currentMode === 'test') {
        // Luôn chấp nhận nối
        item1.classList.add('correct-match');
        item2.classList.add('correct-match');
        
        // Style xanh dương (Trung tính)
        const neutralStyle = "background:#e3f2fd; border-color:#2196f3; color:#0d47a1; opacity:0.6;";
        item1.style.cssText += neutralStyle;
        item2.style.cssText += neutralStyle;
        
        // Hiển thị dấu nối (Chỉ cần hiện ở cột trái cho gọn, hoặc cả 2)
        // Tìm xem cái nào là cột trái (drop-zone) để hiện kết quả
        const leftSide = item1.classList.contains('drop-zone') ? item1 : item2;
        const rightSide = item1.classList.contains('drop-zone') ? item2 : item1;
        
        leftSide.innerHTML = `<span>${leftSide.innerText}</span> <b style='margin:0 5px; color:#2196f3'>=</b> <span>${rightSide.innerText}</span>`;
        
        // Ẩn bên phải đi cho gọn (hoặc giữ lại tùy ý)
        rightSide.style.visibility = 'hidden'; 

        // Ghi nhận kết quả ngầm
        const isPairCorrect = (id1 === id2);
        window.currentDragStatus.push(isPairCorrect);

        matchedCount++;
        let currentQ = currentQuizData[currentQuestionIndex];
        if (matchedCount === currentQ.pairs.length) {
            const isAllCorrect = window.currentDragStatus.every(status => status === true);
            if (isAllCorrect) score++; 
            else {
                 wrongAnswers.push({
                    question: currentQ.question,
                    correctAnswer: "Xem lại ở phần Drag & Drop",
                    userAnswer: "Bạn đã nối sai",
                    explanation: currentQ.explanation
                });
            }
            scoreText.innerText = `Điểm: ${score}`;
            setTimeout(() => handleNextButton(), 500);
        }
    } 
    else {
        // --- CHẾ ĐỘ ÔN TẬP ---
        if (id1 === id2) {
            // ĐÚNG
            item1.classList.add('correct-match');
            item2.classList.add('correct-match');
            
            // Style xanh lá
            const correctStyle = "background:#d4edda; border-color:#28a745; color:#155724;";
            item1.style.cssText += correctStyle;
            item2.style.cssText += correctStyle;
            
            // Tìm cột trái để hiện text nối
            const leftSide = item1.classList.contains('drop-zone') ? item1 : item2;
            const rightSide = item1.classList.contains('drop-zone') ? item2 : item1;
            
            leftSide.innerHTML = `<span>${leftSide.innerText}</span> <b style='margin:0 5px; color:green'>=</b> <span>${rightSide.innerText}</span>`;
            rightSide.style.visibility = 'hidden'; // Ẩn cột phải đã nối đúng đi

            if(isSfxOn) { correctSound.currentTime=0; correctSound.play(); }

            matchedCount++;
            let currentQ = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
            if (matchedCount === currentQ.pairs.length) {
                handleCorrectAnswer(); 
            }
        } else {
            // SAI
            // Nháy đỏ cả 2 ô
            item1.style.background = '#f8d7da'; item1.style.borderColor = '#e74c3c';
            item2.style.background = '#f8d7da'; item2.style.borderColor = '#e74c3c';
            
            if(isSfxOn) { wrongSound.currentTime = 0; wrongSound.play(); }

            setTimeout(() => {
                // Reset về màu cũ
                item1.style.background = ''; item1.style.borderColor = '';
                item2.style.background = ''; item2.style.borderColor = '';
                // Nếu style bị mất, trả lại style mặc định
                if(item1.classList.contains('drop-zone')) {
                    item1.style.background='#ffffff'; item1.style.borderColor='#95a5a6';
                } else {
                    item1.style.background='#ecf0f1'; item1.style.borderColor='#3498db';
                }
                if(item2.classList.contains('drop-zone')) {
                    item2.style.background='#ffffff'; item2.style.borderColor='#95a5a6';
                } else {
                    item2.style.background='#ecf0f1'; item2.style.borderColor='#3498db';
                }
            }, 500);
        }
    }
}
// Khởi chạy
loadAllData();

