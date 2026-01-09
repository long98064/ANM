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
        btnMath.classList.remove('hide'); 
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

    // 2. Xử lý chế độ
    if (currentMode === 'math') {
        currentQuizData = [...mathQuestions].sort(() => 0.5 - Math.random());
        timerBox.classList.add('hide');
    } 
    else if (currentMode === 'test') {
        // --- CẤU HÌNH THI THỬ ---
        const totalReq = 70; // Tổng số câu yêu cầu
        const timeLimit = 40; // Phút
        
        // Số lượng cố định các loại đặc biệt
        const reqMath = 5;
        const reqDrag = 3;
        const reqText = 3;
        
        // A. Lấy Toán (5 câu)
        let selectedMath = [];
        if (mathQuestions && mathQuestions.length > 0) {
            let mathPool = [...mathQuestions].sort(() => 0.5 - Math.random());
            selectedMath = mathPool.slice(0, reqMath);
        }

        // B. Phân loại câu hỏi từ Môn chính
        // Lọc ra 3 loại: Drag, Text, và Choice (Trắc nghiệm thường)
        let dragPool = mainSubjectData.filter(q => q.type === 'drag');
        let textPool = mainSubjectData.filter(q => q.type === 'text');
        // Những câu còn lại (không phải drag, không phải text) là trắc nghiệm
        let choicePool = mainSubjectData.filter(q => q.type !== 'drag' && q.type !== 'text');

        // Trộn ngẫu nhiên từng kho
        dragPool.sort(() => 0.5 - Math.random());
        textPool.sort(() => 0.5 - Math.random());
        choicePool.sort(() => 0.5 - Math.random());

        // C. Lấy câu hỏi đặc biệt (Drag & Text)
        let selectedDrag = dragPool.slice(0, reqDrag);
        let selectedText = textPool.slice(0, reqText);

        // D. Tính số lượng trắc nghiệm cần lấy (Choice)
        // Tổng hiện tại = (Toán đã lấy) + (Drag đã lấy) + (Text đã lấy)
        let currentCount = selectedMath.length + selectedDrag.length + selectedText.length;
        
        // Số câu trắc nghiệm cần lấy = 70 - Tổng hiện tại
        // (Thường sẽ là 59 câu, nhưng nếu thiếu Drag/Text thì số này tự tăng lên để bù)
        let neededChoice = totalReq - currentCount;
        
        // Lấy trắc nghiệm
        let selectedChoice = choicePool.slice(0, neededChoice);

        // E. Gộp tất cả và trộn lần cuối
        currentQuizData = [
            ...selectedMath, 
            ...selectedDrag, 
            ...selectedText, 
            ...selectedChoice
        ].sort(() => 0.5 - Math.random());
        
        startTimer(timeLimit);
    } 
    else {
        // Chế độ Ôn tập (Practice) - Lấy hết trộn đều
        currentQuizData = [...mainSubjectData].sort(() => 0.5 - Math.random());
        timerBox.classList.add('hide');
    }
    
    // Reset trạng thái nối cho phần Drag Mode Thi Thử
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
// --- RENDER 2: ĐIỀN TỪ (TEXT INPUT) - CẬP NHẬT NÚT BỎ QUA ---
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
// BỘ CODE KÉO THẢ (DRAG & DROP) ĐÃ SỬA LỖI & BẮT LỖI
// ============================================================

function renderDragDrop(q) {
    window.currentDragStatus = [];  
    try {
        // 1. Ép giao diện về dạng Block (để không bị nát nếu đang ở chế độ Grid)
        if(answerButtonsElement) {
            answerButtonsElement.style.display = "block";
            answerButtonsElement.style.gridTemplateColumns = "none";
        }

        matchedCount = 0;
        const container = document.createElement('div');
        container.classList.add('drag-container');
        // Style cho container
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.gap = '20px';
        container.style.width = '100%';
        container.style.marginTop = '20px';

        const colLeft = document.createElement('div');
        colLeft.style.flex = '1'; 
        colLeft.style.display='flex'; 
        colLeft.style.flexDirection='column'; 
        colLeft.style.gap='15px';
        
        const colRight = document.createElement('div');
        colRight.style.flex = '1'; 
        colRight.style.display='flex'; 
        colRight.style.flexDirection='column'; 
        colRight.style.gap='15px';

        // Kiểm tra dữ liệu
        if (!q.pairs) {
            alert("Lỗi: Câu hỏi này thiếu dữ liệu nối (pairs)!");
            return;
        }

        const shuffledPairs = [...q.pairs].sort(() => Math.random() - 0.5);

        // --- TẠO CỘT TRÁI (VÙNG THẢ) ---
        q.pairs.forEach(pair => {
            const box = document.createElement('div');
            box.className = 'drop-zone';
            box.innerText = pair.left;
            box.dataset.id = pair.id; // ID để so khớp
            
            // Style cứng (để tránh bị file CSS cũ ghi đè)
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

            // Sự kiện thả
            box.addEventListener('dragover', e => { e.preventDefault(); box.style.borderColor = '#e74c3c'; });
            box.addEventListener('dragleave', () => box.style.borderColor = '#95a5a6');
            box.addEventListener('drop', handleDrop);
            
            colLeft.appendChild(box);
        });

        // --- TẠO CỘT PHẢI (VÙNG KÉO) ---
        shuffledPairs.forEach(pair => {
            const item = document.createElement('div');
            item.className = 'draggable-item';
            item.innerText = pair.right;
            item.draggable = true;
            item.dataset.id = pair.id; // ID khớp với bên trái

            // Style cứng
            item.style.padding = '15px';
            item.style.border = '1px solid #3498db';
            item.style.borderRadius = '8px';
            item.style.background = '#ecf0f1';
            item.style.color = '#333333';
            item.style.minHeight = '60px';
            item.style.cursor = 'grab';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
            item.style.textAlign = 'center';

            // Sự kiện kéo
            item.addEventListener('dragstart', () => {
                draggedItem = item;
                setTimeout(() => item.style.opacity = '0.5', 0);
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                draggedItem = null;
            });
            
            colRight.appendChild(item);
        });

        container.appendChild(colLeft);
        container.appendChild(colRight);
        answerButtonsElement.appendChild(container);

    } catch (err) {
        console.error(err);
        alert("Lỗi hiển thị DragDrop: " + err.message);
    }
}

// --- XỬ LÝ SỰ KIỆN THẢ (DROP) ---
function handleDrop(e) {
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;

    // Reset màu viền (nếu đang hover)
    dropZone.style.borderColor = '#95a5a6';

    // Nếu hộp này đã nối rồi thì chặn
    if (dropZone.classList.contains('correct-match')) return;

    if (draggedItem) {
        const dragId = draggedItem.dataset.id;
        const zoneId = dropZone.dataset.id;
        
        // ====================================================
        // LOGIC KHÁC BIỆT GIỮA THI THỬ VÀ ÔN TẬP
        // ====================================================
        
        if (currentMode === 'test') {
            // --- CHẾ ĐỘ THI THỬ (TEST) ---
            // 1. CHẤP NHẬN MỌI CẶP NỐI (Không cần đúng ID)
            dropZone.classList.add('correct-match'); // Đánh dấu là đã nối
            
            // 2. Hiện màu trung tính (Xanh dương/Xám) - KHÔNG BÁO ĐÚNG SAI
            dropZone.style.background = '#e3f2fd'; // Xanh nhạt
            dropZone.style.borderColor = '#2196f3'; // Viền xanh dương
            dropZone.style.color = '#0d47a1';
            
            // 3. Hiển thị kết quả nối
            dropZone.innerHTML = `<span>${dropZone.innerText}</span> <b style='margin:0 10px; color:#2196f3'>=</b> <span>${draggedItem.innerText}</span>`;
            draggedItem.remove(); 

            // 4. Lưu ngầm kết quả (Đúng hay Sai) vào mảng tạm
            const isPairCorrect = (dragId === zoneId);
            window.currentDragStatus.push(isPairCorrect);

            matchedCount++;
            
            // 5. Nếu đã nối hết các cặp -> TÍNH ĐIỂM NGẦM & CHUYỂN CÂU
            let currentQ = currentQuizData[currentQuestionIndex];
            if (matchedCount === currentQ.pairs.length) {
                // Kiểm tra: Nếu TẤT CẢ các cặp đều True thì mới được điểm
                const isAllCorrect = window.currentDragStatus.every(status => status === true);
                
                if (isAllCorrect) {
                    score++; // Cộng điểm ngầm
                } else {
                    // Nếu sai, lưu vào danh sách sai để xem lại ở cuối
                    // Tạo một đáp án giả để hiển thị trong phần Review
                    wrongAnswers.push({
                        question: currentQ.question,
                        correctAnswer: "Xem lại ở phần Drag & Drop",
                        userAnswer: "Bạn đã nối sai một hoặc nhiều cặp",
                        explanation: currentQ.explanation
                    });
                }
                
                // Cập nhật điểm hiển thị (hoặc giấu đi nếu muốn bí mật hoàn toàn)
                scoreText.innerText = `Điểm: ${score}`;
                
                // Chuyển câu ngay lập tức (không hiện Alert, không hiện Next)
                setTimeout(() => {
                    handleNextButton();
                }, 500); // Delay 0.5s cho mượt
            }

        } else {
            // --- CHẾ ĐỘ ÔN TẬP (PRACTICE) - GIỮ NGUYÊN CODE CŨ ---
            if (dragId === zoneId) {
                // ĐÚNG
                dropZone.classList.add('correct-match');
                dropZone.style.background = '#d4edda'; 
                dropZone.style.borderColor = '#28a745';
                dropZone.style.color = '#155724';
                dropZone.innerHTML = `<span>${dropZone.innerText}</span> <b style='margin:0 10px; color:green'>=</b> <span>${draggedItem.innerText}</span>`;
                draggedItem.remove(); 
                matchedCount++;
                
                let currentQ = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
                if (matchedCount === currentQ.pairs.length) {
                    handleCorrectAnswer(); 
                }
            } else {
                // SAI
                dropZone.style.borderColor = '#e74c3c';
                dropZone.style.background = '#f8d7da';
                setTimeout(() => {
                    dropZone.style.borderColor = '#95a5a6';
                    dropZone.style.background = '#ffffff';
                }, 500);
                if(isSfxOn) { wrongSound.currentTime = 0; wrongSound.play(); }
            }
        }
    }
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
        button.disabled = true; // Khóa nút sau khi chọn
    });

    // 3. --- KHÔI PHỤC PHẦN GIẢI THÍCH (QUAN TRỌNG) ---
    // Hiện giải thích ngay lập tức dù đúng hay sai
    if (questionData.explanation && questionData.explanation.trim() !== "") {
        explanationBox.innerHTML = `<strong>💡 Giải thích:</strong><br>${questionData.explanation}`;
        explanationBox.classList.remove('hide');
        // Kích hoạt MathJax để hiển thị công thức toán trong giải thích
        if (window.MathJax) MathJax.typesetPromise([explanationBox]);
    }

    // 4. Hiện nút Next
    nextButton.classList.remove('hide'); 
}

// Hàm Xử lý ĐÚNG (Dùng chung)
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
    
    // Hiện giải thích nếu có (lấy câu hiện tại)
    let q = isRedemptionMode ? redemptionQuestion : currentQuizData[currentQuestionIndex];
    if (q.explanation) {
        explanationBox.innerHTML = `<strong>💡 Giải thích:</strong><br>${q.explanation}`;
        explanationBox.classList.remove('hide');
        if (window.MathJax) MathJax.typesetPromise([explanationBox]);
    }

    nextButton.classList.remove('hide');
}

// Hàm Xử lý SAI (Dùng chung)
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
    
    // Logic gỡ điểm
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
// 8. CÁC HÀM TIỆN ÍCH (TIMER, CHART, ETC.)
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

// Cài đặt Toggle
function toggleSettings() { settingsModal.classList.toggle('hide'); }
if(toggleSfxBtn) toggleSfxBtn.addEventListener('change', (e) => isSfxOn = e.target.checked);
if(toggleStreakBtn) toggleStreakBtn.addEventListener('change', (e) => { isStreakOn = e.target.checked; updateStreakDisplay(); });
if(toggleBgmBtn) toggleBgmBtn.addEventListener('change', (e) => {
    isMusicOn = e.target.checked;
    isMusicOn ? bgMusic.play().catch(e=>{}) : bgMusic.pause();
});

// Phím tắt
document.addEventListener('keydown', (e) => {
    if (quizBox.classList.contains('hide')) return;
    const options = document.querySelectorAll('#options-container .btn');
    const key = e.key.toLowerCase(); 

    // Chỉ dùng phím tắt cho trắc nghiệm (check nếu có ô input thì thôi)
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

// Chống copy
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && ['c','x','u','s','p','a'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        // alert("Không được copy!");
    }
});

// Khởi chạy
loadAllData();
