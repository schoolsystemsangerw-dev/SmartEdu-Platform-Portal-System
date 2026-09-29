// Supabase Initialization
const SUPABASE_URL = 'https://ggiwmwinrcxrkqcevqnz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SYYnHD1Ws3cz5lva25quxQ_ey7XgL4v';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Image URL Converter & Sanitizer
function getDirectImageUrl(url) {
    if (!url) return '';
    let cleanUrl = url.trim();

    // Convert Google Drive view URLs to direct image streams
    if (cleanUrl.includes('drive.google.com/file/d/')) {
        const fileId = cleanUrl.split('/d/')[1].split('/')[0];
        return `https://lh3.googleusercontent.com/d/${fileId}=s220`;
    }

    // Convert Dropbox sharing links
    if (cleanUrl.includes('dropbox.com')) {
        return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    // Add https if protocol is missing
    if (!/^https?:\/\//i.test(cleanUrl)) {
        return 'https://' + cleanUrl;
    }

    return cleanUrl;
}

// Session State Helper
const Session = {
    getUser: () => JSON.parse(localStorage.getItem('portal_current_user') || 'null'),
    setUser: (user) => localStorage.setItem('portal_current_user', JSON.stringify(user)),
    clear: () => localStorage.removeItem('portal_current_user')
};

let currentUser = Session.getUser();
let jitsiApi = null; // Master instance for Live Video Classes

// Master Admin Access Control
const MASTER_ADMIN_EMAIL = 'schoolsystems.ange.rw@gmail.com';

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    setupAuthTabs();
    setupEventListeners();
    checkSession();
});

// Session Checker
async function checkSession() {
    currentUser = Session.getUser();
    const userBadge = document.getElementById('user-badge');
    const authStatus = document.getElementById('auth-status');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser) {
        // Re-verify user record with Supabase DB
        const { data: dbUser } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('email', currentUser.email)
            .maybeSingle();

        if (dbUser) {
            currentUser = dbUser;
            Session.setUser(dbUser);
        }

        if (userBadge) {
            userBadge.classList.remove('hidden');
            userBadge.classList.add('flex');
        }
        if (authStatus) {
            const displayRole = currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'SYSTEM OWNER' : currentUser.role.toUpperCase();
            authStatus.textContent = `${currentUser.name} (${displayRole})`;
        }
        if (logoutBtn) logoutBtn.classList.remove('hidden');

        // Check teacher approval status
        if (currentUser.role === 'teacher' && currentUser.account_status === 'pending') {
            alert('Your account is awaiting payment verification by the System Owner.');
            Session.clear();
            checkSession();
            return;
        }

        // Handle Master Owner Routing
        if (currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
            showRoleDashboard('owner');
        } else {
            showRoleDashboard(currentUser.role);
        }
    } else {
        if (userBadge) userBadge.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        showAuthSection();
    }
}

// Navigation Controls
function hideAllSections() {
    ['auth-section', 'owner-dashboard', 'teacher-dashboard', 'student-dashboard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showAuthSection() {
    hideAllSections();
    const authSec = document.getElementById('auth-section');
    if (authSec) authSec.classList.remove('hidden');
}

function showRoleDashboard(role) {
    hideAllSections();
    if (role === 'owner') {
        const ownerDb = document.getElementById('owner-dashboard');
        if (ownerDb) ownerDb.classList.remove('hidden');
        renderOwnerDashboard();
    } else if (role === 'teacher') {
        const teacherDb = document.getElementById('teacher-dashboard');
        if (teacherDb) teacherDb.classList.remove('hidden');
        renderTeacherDashboard();
    } else if (role === 'student') {
        const studentDb = document.getElementById('student-dashboard');
        if (studentDb) studentDb.classList.remove('hidden');
        renderStudentDashboard();
    }
}

// Auth UI Navigation
function setupAuthTabs() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('reg-role');
    const teacherFields = document.getElementById('teacher-fields');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md';
            tabRegister.className = 'flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition';
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md';
            tabLogin.className = 'flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition';
            if (registerForm) registerForm.classList.remove('hidden');
            if (loginForm) loginForm.classList.add('hidden');
        });
    }

    if (roleSelect && teacherFields) {
        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'teacher') {
                teacherFields.classList.remove('hidden');
            } else {
                teacherFields.classList.add('hidden');
            }
        });
    }
}

// Event Listeners & Form Handlers
function setupEventListeners() {
    // Registration Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const role = document.getElementById('reg-role')?.value || '';
            const name = document.getElementById('reg-name')?.value || '';
            const email = document.getElementById('reg-email')?.value || '';
            const phone = document.getElementById('reg-phone')?.value || '';
            const password = document.getElementById('reg-password')?.value || '';

            if (!email || !name) {
                alert('Please enter your name and email address.');
                return;
            }

            // Check if profile exists
            const { data: existingUser } = await supabaseClient
                .from('profiles')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                alert('An account with this email already exists.');
                return;
            }

            const rawLogoUrl = role === 'teacher' ? (document.getElementById('reg-school-logo')?.value || '') : '';
            const finalRole = email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'owner' : role;

            // Constructed DB record mapping both naming standards (name/full_name & phone/phone_number)
            const newUser = {
                role: finalRole,
                name: name,
                full_name: name,
                email: email,
                phone: phone,
                phone_number: phone,
                password: password,
                account_status: role === 'teacher' ? 'pending' : 'active',
                school: role === 'teacher' ? (document.getElementById('reg-school')?.value || '') : '',
                school_location: role === 'teacher' ? (document.getElementById('reg-school-location')?.value || '') : '',
                position: role === 'teacher' ? (document.getElementById('reg-position')?.value || '') : '',
                school_logo_url: typeof getDirectImageUrl === 'function' ? getDirectImageUrl(rawLogoUrl) : rawLogoUrl,
                payment_ref: role === 'teacher' ? (document.getElementById('reg-payment-ref')?.value || '') : ''
            };

            const { data: insertedData, error } = await supabaseClient
                .from('profiles')
                .insert([newUser])
                .select();

            if (error) {
                alert('Registration failed: ' + error.message);
                return;
            }

            // Extract inserted user profile or build fallback state
            const savedProfile = (insertedData && insertedData[0]) ? insertedData[0] : newUser;

            // Sync user details to session & local storage immediately
            localStorage.setItem('currentUser', JSON.stringify(savedProfile));
            localStorage.setItem('user', JSON.stringify(savedProfile));
            window.currentUserProfile = savedProfile;

            if (role === 'teacher') {
                alert('Teacher account registered! Pending payment approval by System Owner.');
            } else {
                alert('Account created successfully! You can now log in.');
            }

            // Reset form inputs & switch to login tab
            registerForm.reset();
            document.getElementById('tab-login')?.click();
        });
    }

    // Login Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data: user, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();

            if (error || !user) {
                alert('Invalid email or password.');
                return;
            }

            Session.setUser(user);
            checkSession();
        });
    }

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Session.clear();
            checkSession();
        });
    }

    // Class Generator
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('class-name').value;
            const subject = document.getElementById('class-subject').value;
            const code = subject.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

            const newClass = {
                teacher_email: currentUser.email,
                class_name: name,
                subject: subject,
                class_code: code
            };

            const { error } = await supabaseClient.from('classes').insert([newClass]);

            if (error) {
                alert('Error creating class: ' + error.message);
                return;
            }

            e.target.reset();
            renderTeacherDashboard();
        });
    }

    // Student Join Class
    const joinClassForm = document.getElementById('join-class-form');
    if (joinClassForm) {
        joinClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classCodeInput = document.getElementById('join-class-code') || document.getElementById('join-code');
            const classCode = classCodeInput ? classCodeInput.value.trim().toUpperCase() : '';

            if (!classCode) {
                alert('Please enter a valid class code.');
                return;
            }

            const { data: classData, error: classError } = await supabaseClient
                .from('classes')
                .select('*')
                .eq('class_code', classCode)
                .maybeSingle();

            if (classError || !classData) {
                alert('Invalid Class Code! Please check the code with your teacher.');
                return;
            }

            const { error: enrollError } = await supabaseClient
                .from('enrollments')
                .insert([{
                    student_email: currentUser.email,
                    class_code: classCode
                }]);

            if (enrollError) {
                if (enrollError.code === '23505') {
                    alert('You have already joined this class!');
                } else {
                    alert('Failed to join class: ' + enrollError.message);
                }
                return;
            }

            alert('Successfully joined ' + classData.class_name + '!');
            if (classCodeInput) classCodeInput.value = '';
            renderStudentDashboard();
        });
    }
}

// Universal Cross-Platform Live Classroom Engine
window.startLiveStream = function(classCode, className) {
    const modal = document.getElementById('live-stream-modal');
    const title = document.getElementById('live-stream-title');
    const container = document.getElementById('jitsi-container');

    if (!modal || !container) {
        alert("Live class modal container not found in HTML!");
        return;
    }

    const isTeacher = currentUser?.role === 'teacher';
    
    title.textContent = `Live Class: ${className} (${classCode}) — ${isTeacher ? 'Broadcasting (Host)' : 'Viewer Mode'}`;
    modal.classList.remove('hidden');
    container.innerHTML = '';

    const domain = 'meet.element.io';
    const roomName = `SmartEdu_Class_${classCode.replace(/[^a-zA-Z0-9]/g, '')}`;

    const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
            displayName: `${currentUser?.name || 'User'} (${isTeacher ? 'Teacher / Host' : 'Student'})`
        },
        configOverwrite: {
            prejoinPageEnabled: false,
            prejoinConfig: {
                enabled: false
            },
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            disableDeepLinking: true,
            mobileAppPromotionsEnabled: false,
            disableAudioLevels: !isTeacher,
            desktopSharingFrameRate: {
                min: 20,
                max: 30
            },
            filmStripOnly: false,
            disableSelfView: !isTeacher
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
            TOOLBAR_BUTTONS: isTeacher ? [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'hangup', 'chat', 'raisehand', 'participants-pane'
            ] : [
                'microphone', 'fullscreen', 'hangup', 'chat', 'raisehand'
            ],
            VERTICAL_FILMSTRIP: false,
            HIDE_KICK_BACKGROUND_MEDIA: true,
            OPTIMIZE_FOR_MOBILE: true,
            DISABLE_FOCUS_INDICATOR: true
        }
    };

    if (typeof JitsiMeetExternalAPI !== 'undefined') {
        jitsiApi = new JitsiMeetExternalAPI(domain, options);

        jitsiApi.addEventListener('videoConferenceLeft', () => {
            window.closeLiveStream();
        });

        jitsiApi.addEventListener('videoConferenceJoined', () => {
            jitsiApi.executeCommand('setTileView', false);
        });

        jitsiApi.addEventListener('largeVideoChanged', () => {
            jitsiApi.executeCommand('setTileView', false);
        });
    } else {
        alert("Jitsi API script not loaded. Check index.html head.");
    }
};

// Global Stream Cleanup Function
window.closeLiveStream = function() {
    if (typeof jitsiApi !== 'undefined' && jitsiApi) {
        try {
            jitsiApi.dispose();
        } catch (e) {
            console.warn("Jitsi cleanup warning:", e);
        }
        jitsiApi = null;
    }
    
    const container = document.getElementById('jitsi-container');
    if (container) container.innerHTML = '';

    const modal = document.getElementById('live-stream-modal');
    if (modal) modal.classList.add('hidden');
};

// System Owner Dashboard
async function renderOwnerDashboard() {
    const container = document.getElementById('owner-pending-list');
    if (!container) return;

    const { data: pendingTeachers, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('account_status', 'pending');

    if (error || !pendingTeachers || pendingTeachers.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center">No pending teacher payment approvals.</p>`;
        return;
    }

    container.innerHTML = pendingTeachers.map(p => {
        const logoUrl = getDirectImageUrl(p.school_logo_url);
        return `
            <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex items-start gap-3">
                    ${logoUrl ? `
                        <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                            <img src="${logoUrl}" 
                                 alt="School Logo" 
                                 class="w-full h-full object-contain rounded-lg"
                                 onerror="this.onerror=null; this.parentElement.style.display='none';" />
                        </div>
                    ` : ''}
                    <div class="space-y-1">
                        <h4 class="font-bold text-sm text-white">${p.name} <span class="text-xs font-normal text-indigo-400">(${p.position || 'Teacher'})</span></h4>
                        <p class="text-xs text-indigo-300 font-semibold">${p.school || 'Unspecified School'} ${p.school_location ? `• ${p.school_location}` : ''}</p>
                        <p class="text-xs text-slate-400">Phone: <span class="text-slate-200 font-mono">${p.phone || 'N/A'}</span> | Email: ${p.email}</p>
                        <p class="text-xs font-bold text-amber-400">MoMo Ref ID: ${p.payment_ref || 'N/A'}</p>
                    </div>
                </div>
                <button onclick="window.approveUser('${p.email}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 self-end md:self-center">
                    Approve Payment
                </button>
            </div>
        `;
    }).join('');
}

// Approve Teacher Account Payment
window.approveUser = async function(email) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ account_status: 'active' })
        .eq('email', email);

    if (error) {
        alert('Approval failed: ' + error.message);
        return;
    }

    renderOwnerDashboard();
    alert(`Account approved successfully!`);
};

// Teacher Dashboard (with Exam Creation, Results Tracking & Report Card Generation)
async function renderTeacherDashboard() {
    const container = document.getElementById('teacher-classes-cards');
    if (!container) return;

    const { data: classes, error } = await supabaseClient
        .from('classes')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    if (error || !classes || classes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">No classes created yet. Fill out the form on the left to create your first class.</p>`;
        return;
    }

    // Fetch active exams for this teacher
    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    const logoUrl = typeof getDirectImageUrl === 'function' ? getDirectImageUrl(currentUser?.school_logo_url) : null;

    container.innerHTML = classes.map(c => {
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];

        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${c.class_name || c.name || 'Class'}</h4>
                            <p class="text-xs text-slate-400">${c.subject || ''}</p>
                        </div>
                        ${logoUrl ? `
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${logoUrl}" 
                                     alt="School Logo" 
                                     class="w-full h-full object-contain rounded-lg"
                                     onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        ` : ''}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">School:</span> ${currentUser?.school || 'N/A'} ${currentUser?.school_location ? `(${currentUser.school_location})` : ''}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${currentUser?.name || 'Teacher'} (${currentUser?.position || 'Teacher'})</p>
                        <p class="text-slate-300"><span class="text-slate-500">Phone:</span> <span class="font-mono text-indigo-300">${currentUser?.phone || 'N/A'}</span></p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${c.class_code}</span>
                    </div>
                </div>

                <!-- Live Stream & Exam Controls -->
                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name || c.name}')" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="video" class="w-4 h-4"></i> Start Live Class / Screen Share
                    </button>

                    <button onclick="window.openCreateExamModal('${c.class_code}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="file-plus" class="w-4 h-4"></i> Create / Load Exam
                    </button>

                    ${classExams.map(ex => `
                        <button onclick="window.viewExamResults(${ex.id})" class="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold rounded-xl text-[11px] transition flex items-center justify-between px-3">
                            <span class="truncate">📊 ${ex.title || ex.exam_title || 'Exam'} Results</span>
                            <span class="text-emerald-400 font-bold">View Marks</span>
                        </button>
                    `).join('')}

                    <!-- REPORT CARD GENERATOR SECTION -->
                    <div class="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                        <h5 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <i data-lucide="file-text" class="w-3.5 h-3.5 text-emerald-400"></i> Generate Student Report Card
                        </h5>

                        <div class="space-y-2">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[10px] text-slate-400 font-medium mb-1">Academic Year</label>
                                    <select id="reportYear_${c.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                        <option value="2026" selected>2026</option>
                                        <option value="2025">2025</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] text-slate-400 font-medium mb-1">Term</label>
                                    <select id="reportTerm_${c.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3" selected>Term 3</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Select Student</label>
                                <select id="reportStudentSelect_${c.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                </select>
                            </div>

                            <button onclick="handleGenerateReport('${c.class_code}', '${c.class_name || c.name || 'Class'}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Report Card (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();

    // Populate student dropdowns for each class card
    classes.forEach(c => {
        if (typeof loadStudentsForReport === 'function') {
            loadStudentsForReport(c.class_code);
        }
    });
}

// Student Dashboard (with Active Exam Session, Score Feedback, Marking Guide & Report Card View)
async function renderStudentDashboard() {
    const container = document.getElementById('student-classes-cards');
    if (!container) return;

    const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments')
        .select('class_code')
        .eq('student_email', currentUser?.email);

    if (enrollError || !enrollments || enrollments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">You haven't joined any classes yet. Enter a code above to get started.</p>`;
        return;
    }

    const classCodes = enrollments.map(e => e.class_code);

    const { data: classes, error: classError } = await supabaseClient
        .from('classes')
        .select('*')
        .in('class_code', classCodes);

    if (classError || !classes || classes.length === 0) return;

    // Fetch active exams & student submissions
    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .in('class_code', classCodes);

    const { data: submissions } = await supabaseClient
        .from('submissions')
        .select('*')
        .eq('student_email', currentUser?.email);

    // Fetch teacher profile details
    const teacherEmails = [...new Set(classes.map(c => c.teacher_email))];
    const { data: teacherProfiles } = await supabaseClient
        .from('profiles')
        .select('*')
        .in('email', teacherEmails);

    const teacherMap = {};
    if (teacherProfiles) {
        teacherProfiles.forEach(t => { teacherMap[t.email] = t; });
    }

    container.innerHTML = classes.map(c => {
        const teacher = teacherMap[c.teacher_email] || {};
        const logoUrl = typeof getDirectImageUrl === 'function' ? getDirectImageUrl(teacher.school_logo_url) : null;
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];

        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${c.class_name || c.name || 'Class'}</h4>
                            <p class="text-xs text-slate-400">${c.subject || ''}</p>
                        </div>
                        ${logoUrl ? `
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${logoUrl}" 
                                     alt="School Logo" 
                                     class="w-full h-full object-contain rounded-lg"
                                     onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        ` : ''}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">School:</span> ${teacher.school || 'N/A'} ${teacher.school_location ? `(${teacher.school_location})` : ''}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${teacher.name || 'N/A'} ${teacher.position ? `(${teacher.position})` : ''}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Phone:</span> <span class="font-mono text-indigo-300">${teacher.phone || 'N/A'}</span></p>
                        <p class="text-slate-300"><span class="text-slate-500">Email:</span> ${teacher.email || c.teacher_email}</p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${c.class_code}</span>
                    </div>
                </div>

                <!-- Live Stream & Student Exam Buttons -->
                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name || c.name}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="video" class="w-4 h-4"></i> Join Live Class
                    </button>

                    ${classExams.map(ex => {
                        const sub = submissions ? submissions.find(s => s.exam_id === ex.id) : null;
                        if (sub) {
                            return `
                                <button onclick="window.viewStudentMarkingGuide(${ex.id})" class="w-full py-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs px-3 flex justify-between items-center font-semibold transition">
                                    <span class="flex items-center gap-1.5"><i data-lucide="file-check" class="w-4 h-4 text-emerald-400"></i> ${ex.title}</span>
                                    <span class="font-mono font-bold text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">${sub.score_obtained}/${ex.total_marks} (${sub.percentage}%) - Guide</span>
                                </button>
                            `;
                        } else {
                            return `
                                <button onclick="window.openStudentExam(${ex.id})" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-between px-3 shadow-md">
                                    <span class="flex items-center gap-1.5"><i data-lucide="edit-3" class="w-4 h-4"></i> ${ex.title}</span>
                                    <span class="bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-200 border border-emerald-700/80">⏱️ ${ex.duration_minutes}m | ${ex.total_marks} pts</span>
                                </button>
                            `;
                        }
                    }).join('')}

                    <!-- STUDENT REPORT CARD GENERATOR SECTION -->
                    <div class="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                        <h5 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <i data-lucide="award" class="w-3.5 h-3.5 text-emerald-400"></i> My Report Card
                        </h5>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Academic Year</label>
                                <select id="studentReportYear_${c.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="2026" selected>2026</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Term</label>
                                <select id="studentReportTerm_${c.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3" selected>Term 3</option>
                                </select>
                            </div>
                        </div>

                        <button onclick="downloadMyReportCard('${c.class_code}', '${c.class_name || c.name || 'Class'}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i> Download My Report Card (PDF)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Student self-service PDF report downloader function
async function downloadMyReportCard(classCode, className) {
    const termSelect = document.getElementById(`studentReportTerm_${classCode}`);
    const yearSelect = document.getElementById(`studentReportYear_${classCode}`);

    const selectedTerm = termSelect ? termSelect.value : 'Term 3';
    const selectedYear = yearSelect ? yearSelect.value : '2026';
    const studentName = currentUser?.name || currentUser?.full_name || 'Student';

    const { data: marks, error } = await supabaseClient
        .from('student_marks')
        .select('subject_name, marks_obtained, max_marks')
        .eq('student_email', currentUser?.email)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear);

    if (error || !marks || marks.length === 0) {
        alert(`No marks recorded for ${selectedTerm} (${selectedYear}).`);
        return;
    }

    await generateReportCard(studentName, className, marks, {
        name: currentUser?.school || "SMARTEDU ACADEMY",
        location: currentUser?.school_location || "NYAGATARE",
        term: selectedTerm,
        year: selectedYear
    });
}

// Open Exam Creation Modal for Teachers
window.openCreateExamModal = function(classCode) {
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    title.innerText = "Create & Publish Class Exam";
    subtitle.innerText = `Class Code: ${classCode}`;

    body.innerHTML = `
        <form id="create-exam-form" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">Exam Title</label>
                <input type="text" id="exam-title" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" placeholder="e.g. Unit 2 Grammar Quiz">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Duration (Minutes)</label>
                    <input type="number" id="exam-duration" required value="30" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Total Marks</label>
                    <input type="number" id="exam-total-marks" required value="100" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">Exam Questions (One per line)</label>
                <p class="text-[11px] text-slate-500 mb-2">Use {Answer} for fill-in answers or [Option A* | Option B] for multiple choice.</p>
                <textarea id="exam-questions" rows="6" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono" placeholder="1. What is the capital of Rwanda? {Kigali}&#10;2. Water boils at [100°C* | 50°C | 0°C]."></textarea>
            </div>
        </form>
    `;

    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">Cancel</button>
        <button onclick="window.saveExam('${classCode}')" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg">Publish Exam</button>
    `;

    modal.classList.remove('hidden');
};

// Global Save Exam Handler for Teachers
window.saveExam = async function(classCode) {
    const title = document.getElementById('exam-title')?.value.trim();
    const duration = parseInt(document.getElementById('exam-duration')?.value || '30');
    const totalMarks = parseInt(document.getElementById('exam-total-marks')?.value || '100');
    const questionsRaw = document.getElementById('exam-questions')?.value.trim();

    if (!title || !questionsRaw) {
        alert("Please fill in both the Exam Title and Questions!");
        return;
    }

    if (!currentUser || !currentUser.email) {
        alert("User session error. Please re-login.");
        return;
    }

    const { error } = await supabaseClient
        .from('exams')
        .insert([{
            class_code: classCode,
            teacher_email: currentUser.email,
            title: title,
            duration_minutes: duration,
            total_marks: totalMarks,
            questions: questionsRaw
        }]);

    if (error) {
        alert("Error publishing exam: " + error.message);
    } else {
        alert("Exam published successfully!");
        window.closeExamModal();
        if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
    }
};

// Global Close Modal Handler
window.closeExamModal = function() {
    const modal = document.getElementById('exam-modal');
    if (modal) modal.classList.add('hidden');
};

// Student Take Exam Modal Launcher
window.openStudentExam = async function(examId) {
    const { data: exam, error } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

    if (error || !exam) {
        alert("Could not load exam details.");
        return;
    }

    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    title.innerText = exam.title;
    subtitle.innerText = `Duration: ${exam.duration_minutes} Mins | Total Marks: ${exam.total_marks}`;

    const lines = exam.questions.split('\n').filter(l => l.trim() !== '');
    
    let html = `<form id="student-exam-form" class="space-y-4">`;
    lines.forEach((line, idx) => {
        html += `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">`;
        if (line.includes('[') && line.includes(']')) {
            const qText = line.split('[')[0].trim();
            const rawOptions = line.substring(line.indexOf('[') + 1, line.indexOf(']')).split('|');
            
            html += `<p class="text-xs font-bold text-white">${qText}</p><div class="space-y-1 mt-2">`;
            rawOptions.forEach(opt => {
                const cleanOpt = opt.replace('*', '').trim();
                html += `
                    <label class="flex items-center gap-2 text-xs text-slate-300 p-2 bg-slate-900 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-800">
                        <input type="radio" name="q_${idx}" value="${cleanOpt}" class="text-indigo-600">
                        ${cleanOpt}
                    </label>
                `;
            });
            html += `</div>`;
        } else if (line.includes('{') && line.includes('}')) {
            const qText = line.replace(/\{([^}]+)\}/g, '_____');
            html += `
                <p class="text-xs font-bold text-white">${qText}</p>
                <input type="text" name="q_${idx}" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-2" placeholder="Type your answer here...">
            `;
        } else {
            html += `<p class="text-xs font-bold text-white">${line}</p>`;
        }
        html += `</div>`;
    });
    html += `</form>`;

    body.innerHTML = html;
    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
        <button onclick="window.submitStudentExam(${exam.id})" class="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg">Submit Answers</button>
    `;

    modal.classList.remove('hidden');
};

// Student Auto-Grading Submission Handler & Marking Guide Generator
window.submitStudentExam = async function(examId) {
    const form = document.getElementById('student-exam-form');
    if (!form) return;

    const { data: exam, error } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

    if (error || !exam) {
        alert("Failed to evaluate exam. Please try again.");
        return;
    }

    const lines = exam.questions.split('\n').filter(l => l.trim() !== '');
    let totalQuestions = lines.length;
    let correctCount = 0;
    const studentAnswers = {};

    lines.forEach((line, idx) => {
        let expectedAnswer = "";
        let studentAnswer = "";

        if (line.includes('[') && line.includes(']')) {
            const rawOptions = line.substring(line.indexOf('[') + 1, line.indexOf(']')).split('|');
            const correctOpt = rawOptions.find(o => o.includes('*'));
            if (correctOpt) expectedAnswer = correctOpt.replace('*', '').trim().toLowerCase();

            const selectedRadio = form.querySelector(`input[name="q_${idx}"]:checked`);
            if (selectedRadio) studentAnswer = selectedRadio.value.trim().toLowerCase();
        } else if (line.includes('{') && line.includes('}')) {
            const match = line.match(/\{([^}]+)\}/);
            if (match) expectedAnswer = match[1].trim().toLowerCase();

            const textInput = form.querySelector(`input[name="q_${idx}"]`);
            if (textInput) studentAnswer = textInput.value.trim().toLowerCase();
        }

        studentAnswers[`q_${idx}`] = studentAnswer;

        if (studentAnswer && expectedAnswer && studentAnswer === expectedAnswer) {
            correctCount++;
        }
    });

    const pointsPerQuestion = exam.total_marks / (totalQuestions || 1);
    const scoreObtained = Math.round(correctCount * pointsPerQuestion);
    const percentage = Math.round((scoreObtained / exam.total_marks) * 100);

    const studentEmail = currentUser?.email || 'student@smartedu.rw';
    const studentName = currentUser?.name || currentUser?.full_name || 'Student';

    const { error: subError } = await supabaseClient
        .from('submissions')
        .insert([{
            exam_id: examId,
            student_email: studentEmail,
            student_name: studentName,
            score_obtained: scoreObtained,
            percentage: percentage,
            answers: JSON.stringify(studentAnswers)
        }]);

    if (subError) {
        alert("Error submitting exam: " + subError.message);
    } else {
        // Display the marking guide directly inside the modal
        window.renderMarkingGuideInModal(exam, studentAnswers, scoreObtained, percentage);
        if (typeof renderStudentDashboard === 'function') renderStudentDashboard();
    }
};

// Function to render Marking Guide in Modal
window.renderMarkingGuideInModal = function(exam, studentAnswers, scoreObtained, percentage) {
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!title || !body) return;

    const isPassed = percentage >= 50;

    title.innerText = `Marking Guide: ${exam.title}`;
    subtitle.innerText = `Score: ${scoreObtained} / ${exam.total_marks} (${percentage}%) - ${isPassed ? 'PASSED 🎉' : 'NEEDS IMPROVEMENT ⚠️'}`;

    const lines = exam.questions.split('\n').filter(l => l.trim() !== '');

    let html = `
        <div class="space-y-4">
            <div class="p-4 rounded-xl text-center font-bold ${isPassed ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}">
                <p class="text-sm">Exam Submitted Successfully!</p>
                <p class="text-xs font-normal mt-1 text-slate-300">Below is the question-by-question breakdown and correct answers.</p>
            </div>
    `;

    lines.forEach((line, idx) => {
        let qText = "";
        let expectedAnswer = "";
        let rawOptions = [];
        const studentAns = studentAnswers[`q_${idx}`] || "No Answer";

        if (line.includes('[') && line.includes(']')) {
            qText = line.split('[')[0].trim();
            rawOptions = line.substring(line.indexOf('[') + 1, line.indexOf(']')).split('|');
            const correctOpt = rawOptions.find(o => o.includes('*'));
            if (correctOpt) expectedAnswer = correctOpt.replace('*', '').trim();
        } else if (line.includes('{') && line.includes('}')) {
            qText = line.replace(/\{([^}]+)\}/g, '_____');
            const match = line.match(/\{([^}]+)\}/);
            if (match) expectedAnswer = match[1].trim();
        } else {
            qText = line;
        }

        const isCorrect = String(studentAns).trim().toLowerCase() === String(expectedAnswer).trim().toLowerCase();

        html += `
            <div class="bg-slate-950 p-4 rounded-xl border ${isCorrect ? 'border-emerald-800/60' : 'border-rose-800/60'} space-y-2">
                <div class="flex justify-between items-start gap-2">
                    <p class="text-xs font-bold text-white">Q${idx + 1}: ${qText}</p>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${isCorrect ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}">
                        ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                </div>

                ${rawOptions.length > 0 ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                        ${rawOptions.map(opt => {
                            const cleanOpt = opt.replace('*', '').trim();
                            const isSelected = cleanOpt.toLowerCase() === studentAns.toLowerCase();
                            const isRight = cleanOpt.toLowerCase() === expectedAnswer.toLowerCase();

                            let cardStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (isRight) cardStyle = "bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold";
                            else if (isSelected && !isRight) cardStyle = "bg-rose-950/70 border-rose-600 text-rose-200 font-bold";

                            return `
                                <div class="p-2 rounded-lg border text-[11px] ${cardStyle}">
                                    ${cleanOpt} ${isRight ? '✓ (Correct)' : (isSelected ? '✗ (Your Answer)' : '')}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-xs space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-2">
                        <p><span class="text-slate-400">Your Answer:</span> <strong class="${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">${studentAns}</strong></p>
                        <p><span class="text-slate-400">Correct Answer:</span> <strong class="text-emerald-400">${expectedAnswer}</strong></p>
                    </div>
                `}
            </div>
        `;
    });

    html += `</div>`;

    body.innerHTML = html;
    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg">Done Reviewing</button>
    `;
};

// View Student Marking Guide anytime from Student Dashboard
window.viewStudentMarkingGuide = async function(examId) {
    const { data: exam, error: examErr } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

    const { data: sub, error: subErr } = await supabaseClient
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_email', currentUser?.email)
        .single();

    if (examErr || subErr || !exam || !sub) {
        alert("Could not retrieve marking guide.");
        return;
    }

    let parsedAnswers = {};
    try {
        parsedAnswers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : (sub.answers || {});
    } catch(e) {
        parsedAnswers = {};
    }

    const modal = document.getElementById('exam-modal');
    if (modal) modal.classList.remove('hidden');

    window.renderMarkingGuideInModal(exam, parsedAnswers, sub.score_obtained, sub.percentage);
};

// Teacher View Exam Results Modal
window.viewExamResults = async function(examId) {
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    const { data: exam, error: examError } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

    if (examError || !exam) {
        alert("Could not load exam details.");
        return;
    }

    const { data: submissions, error: subError } = await supabaseClient
        .from('submissions')
        .select('*')
        .eq('exam_id', examId)
        .order('score_obtained', { ascending: false });

    title.innerText = `Exam Results: ${exam.title}`;
    subtitle.innerText = `Total Marks: ${exam.total_marks} | Total Submissions: ${submissions ? submissions.length : 0}`;

    if (subError || !submissions || submissions.length === 0) {
        body.innerHTML = `
            <div class="text-center py-8 space-y-2">
                <p class="text-slate-400 text-sm font-semibold">No submissions received yet.</p>
                <p class="text-slate-500 text-xs">Student scores will appear here automatically once they complete the exam.</p>
            </div>
        `;
    } else {
        body.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                            <th class="py-3 px-3">Student Name</th>
                            <th class="py-3 px-3">Email</th>
                            <th class="py-3 px-3 text-center">Score</th>
                            <th class="py-3 px-3 text-center">Percentage</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        ${submissions.map(sub => `
                            <tr class="hover:bg-slate-950/50 transition">
                                <td class="py-3 px-3 font-bold text-white">${sub.student_name || 'Student'}</td>
                                <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">${sub.student_email}</td>
                                <td class="py-3 px-3 text-center font-mono font-bold text-indigo-300">${sub.score_obtained} /${exam.total_marks}</td>
                                <td class="py-3 px-3 text-center">
                                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        sub.percentage >= 50 
                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                                    }">
                                        ${sub.percentage}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">Close</button>
    `;

    modal.classList.remove('hidden');
};

// ==========================================
// HELP DESK, MODAL & USER DIRECTORY MODULE
// ==========================================

// Helper function: Standard UUID format checker
function isValidUUID(str) {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str).trim());
}

// 1. Toggle Help Desk Modal Visibility & Auto-fill inputs
window.toggleHelpModal = function(show) {
    const modal = document.getElementById('help-desk-modal');
    if (modal) {
        if (show) {
            modal.classList.remove('hidden');

            // Auto-populate inputs from active session if empty
            const storedUser = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
            const nameInput = document.getElementById('help-user-name');
            const emailInput = document.getElementById('help-user-email');
            const phoneInput = document.getElementById('help-user-phone');

            if (nameInput && !nameInput.value) nameInput.value = storedUser.name || storedUser.full_name || '';
            if (emailInput && !emailInput.value) emailInput.value = storedUser.email || '';
            if (phoneInput && !phoneInput.value) phoneInput.value = storedUser.phone || storedUser.phone_number || '';
        } else {
            modal.classList.add('hidden');
        }
    }
};

// 2. Tab Switching Inside Help Desk Modal
window.switchHelpTab = function(tab) {
    const newForm = document.getElementById('help-desk-form');
    const historyView = document.getElementById('help-history-view');
    const btnNew = document.getElementById('tab-btn-new');
    const btnHist = document.getElementById('tab-btn-history');

    if (tab === 'new') {
        if (newForm) newForm.classList.remove('hidden');
        if (historyView) historyView.classList.add('hidden');
        if (btnNew) btnNew.className = "pb-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold";
        if (btnHist) btnHist.className = "pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold";
    } else {
        if (newForm) newForm.classList.add('hidden');
        if (historyView) historyView.classList.remove('hidden');
        if (btnHist) btnHist.className = "pb-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold";
        if (btnNew) btnNew.className = "pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold";
        if (typeof window.loadMyTickets === 'function') window.loadMyTickets();
    }
};

// 3. Load User Directory for Owner Dashboard
window.loadUserDirectory = async function() {
    const tbody = document.getElementById('user-directory-tbody');
    if (!tbody) return;

    try {
        const { data: users, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500">No registered users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => {
            let roleBadge = 'bg-slate-800 text-slate-300';
            if (u.role === 'teacher') roleBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            if (u.role === 'student') roleBadge = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
            if (u.role === 'admin' || u.role === 'owner') roleBadge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';

            const displayName = u.name || u.full_name || u.username || u.display_name || (u.email ? u.email.split('@')[0] : 'Registered User');
            const displayPhone = u.phone || u.phone_number || u.mobile || '';

            return `
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                    <td class="py-3 px-4">
                        <div class="font-bold text-white text-xs">${displayName}</div>
                        ${displayPhone ? `<div class="text-[10px] text-slate-400 font-mono">📞 ${displayPhone}</div>` : ''}
                    </td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${roleBadge}">${u.role || 'Member'}</span></td>
                    <td class="py-3 px-4 font-mono text-slate-300 text-xs">${u.email || 'N/A'}</td>
                    <td class="py-3 px-4 text-emerald-400 font-medium text-xs">● Active</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.warn('Error loading user directory:', err);
    }
};

// 4. Form Submission Handler & Initialization Listener
document.addEventListener('DOMContentLoaded', () => {
    const helpForm = document.getElementById('help-desk-form');
    if (helpForm) {
        helpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const category = document.getElementById('help-category')?.value || 'General Inquiry';
            const message = document.getElementById('help-message')?.value || '';

            if (!message.trim()) {
                alert('Please enter a message before submitting.');
                return;
            }

            // Step A: Read inputs directly from the user form
            let userName = document.getElementById('help-user-name')?.value?.trim() || '';
            let userEmail = document.getElementById('help-user-email')?.value?.trim() || '';
            let userPhone = document.getElementById('help-user-phone')?.value?.trim() || '';
            let userId = null;

            // Step B: Check stored local session for missing info
            const storedUser = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
            if (storedUser) {
                userId = storedUser.id || storedUser.user_id || null;
                if (!userName) userName = storedUser.name || storedUser.full_name || '';
                if (!userEmail) userEmail = storedUser.email || '';
                if (!userPhone) userPhone = storedUser.phone || storedUser.phone_number || storedUser.phone_No || '';
            }

            // Step C: Check Active Supabase Auth Session
            try {
                if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
                    const { data: authData } = await supabaseClient.auth.getUser();
                    if (authData?.user) {
                        userId = authData.user.id || userId;
                        if (!userEmail) userEmail = authData.user.email || '';
                    }
                }
            } catch (err) {
                console.warn('Auth session check warning:', err);
            }

            // Step D: Match against profiles table for fallbacks (Safeguarded against non-UUID user_ids)
            if (userId || userEmail) {
                try {
                    let query = supabaseClient.from('profiles').select('*');
                    
                    if (userId && isValidUUID(userId)) {
                        query = query.eq('id', userId);
                    } else if (userEmail) {
                        query = query.eq('email', userEmail);
                    } else {
                        query = null;
                    }

                    if (query) {
                        const { data: profile } = await query.maybeSingle();
                        if (profile) {
                            userId = profile.id || userId;
                            if (!userName) userName = profile.name || profile.full_name || '';
                            if (!userEmail) userEmail = profile.email || '';
                            if (!userPhone) userPhone = profile.phone || profile.phone_number || '';
                        }
                    }
                } catch (profErr) {
                    console.warn('Profiles query warning:', profErr);
                }
            }

            // Final fallback defaults
            userName = userName || (userEmail ? userEmail.split('@')[0] : 'Registered User');
            userEmail = userEmail || 'N/A';
            userPhone = userPhone || 'N/A';

            // Store email in local session so unauthenticated users can auto-retrieve replies without logging in
            if (userEmail && userEmail !== 'N/A') {
                try {
                    const existingSession = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    existingSession.email = userEmail;
                    if (userName) existingSession.name = userName;
                    if (userPhone) existingSession.phone = userPhone;
                    localStorage.setItem('currentUser', JSON.stringify(existingSession));
                } catch (storeErr) {
                    console.warn('Could not persist submission session email:', storeErr);
                }
            }

            // Ensure user_id sent to Supabase is strictly a valid UUID or NULL to avoid 22P02 database error
            const safeUserId = isValidUUID(userId) ? String(userId) : null;

            try {
                const { error } = await supabaseClient
                    .from('help_tickets')
                    .insert([{
                        user_id: safeUserId,
                        user_name: userName,
                        user_email: userEmail,
                        phone_number: userPhone,
                        category: category,
                        message: message.trim(),
                        status: 'Pending'
                    }]);

                if (error) throw error;

                alert('✅ Complaint/Suggestion successfully sent!');
                
                // Clear message field & reset form
                const msgInput = document.getElementById('help-message');
                if (msgInput) msgInput.value = '';

                if (typeof toggleHelpModal === 'function') toggleHelpModal(false);
                if (typeof window.loadHelpTickets === 'function') window.loadHelpTickets();
                if (typeof window.loadMyTickets === 'function') window.loadMyTickets();

            } catch (err) {
                console.error('Submission error:', err);
                alert('Error submitting ticket: ' + (err.message || 'Database error'));
            }
        });
    }

    // Automatic table populators on DOM load
    if (document.getElementById('help-tickets-tbody') && typeof window.loadHelpTickets === 'function') {
        window.loadHelpTickets();
    }
    if (document.getElementById('my-tickets-container') && typeof window.loadMyTickets === 'function') {
        window.loadMyTickets();
    }
    if (document.getElementById('user-directory-tbody') && typeof window.loadUserDirectory === 'function') {
        window.loadUserDirectory();
    }
});

// 5. Render User's Sent Tickets & Admin Replies
window.loadMyTickets = async function() {
    const container = document.getElementById('my-tickets-container');
    if (!container) return;

    let userEmail = null;

    // Check active Javascript profile object
    if (typeof currentUserProfile !== 'undefined' && currentUserProfile?.email) {
        userEmail = currentUserProfile.email;
    } 
    
    // Check Supabase Auth active session
    if (!userEmail && typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
        try {
            const { data } = await supabaseClient.auth.getUser();
            if (data?.user) userEmail = data.user.email;
        } catch (err) {
            console.warn('Could not fetch auth user email:', err);
        }
    }

    // Check local storage session
    if (!userEmail) {
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}');
        if (storedUser.email) userEmail = storedUser.email;
    }

    // Fallback: Check if the user entered an email in the New Submission form tab input
    if (!userEmail) {
        const emailInput = document.getElementById('help-user-email');
        if (emailInput && emailInput.value.trim()) {
            userEmail = emailInput.value.trim();
        }
    }

    // Fallback: Prompt user to enter their email if no active session or stored input exists
    if (!userEmail) {
        userEmail = prompt("Enter the email address you used when submitting your ticket:");
        if (userEmail && userEmail.trim()) {
            userEmail = userEmail.trim();
            const emailInput = document.getElementById('help-user-email');
            if (emailInput) emailInput.value = userEmail;
            try {
                localStorage.setItem('currentUser', JSON.stringify({ email: userEmail }));
            } catch (e) {}
        }
    }

    // Display message if still no email is provided
    if (!userEmail) {
        container.innerHTML = `
            <div class="text-center py-6 space-y-2">
                <p class="text-xs text-rose-400 font-semibold">Email required to view submitted tickets.</p>
                <p class="text-[11px] text-slate-400">Please enter your email address in the form tab or log in.</p>
                <button onclick="switchHelpTab('new')" class="mt-2 text-[11px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded hover:bg-indigo-600/50">Go to Form</button>
            </div>
        `;
        return;
    }

    try {
        container.innerHTML = `<p class="text-xs text-indigo-400 text-center py-4">Checking tickets for <span class="font-mono">${userEmail}</span>...</p>`;

        // Fetch tickets using case-insensitive email matching (.ilike)
        const { data: tickets, error } = await supabaseClient
            .from('help_tickets')
            .select('*')
            .ilike('user_email', userEmail.trim())
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 space-y-2">
                    <p class="text-xs text-slate-400">No tickets found for <span class="text-indigo-300 font-mono">${userEmail}</span>.</p>
                    <button onclick="switchHelpTab('new')" class="text-[11px] text-indigo-400 underline hover:text-indigo-300">Submit a ticket</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="mb-3 text-[11px] text-slate-400 flex justify-between items-center px-1 border-b border-slate-800 pb-2">
                <span>Showing tickets for: <strong class="text-indigo-300 font-mono">${userEmail}</strong></span>
                <button onclick="localStorage.removeItem('currentUser'); window.loadMyTickets();" class="text-slate-500 hover:text-slate-300 underline text-[10px]">Use Different Email</button>
            </div>
        ` + tickets.map(t => {
            const dateStr = new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isResolved = t.status === 'Resolved';

            return `
                <div class="bg-slate-950 border ${isResolved ? 'border-emerald-800/40' : 'border-slate-800'} rounded-xl p-4 text-xs space-y-2 text-left mb-3 shadow-md">
                    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span class="font-bold text-indigo-300">${t.category || 'General Inquiry'}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] ${isResolved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'} px-2 py-0.5 rounded border uppercase font-bold text-[9px]">${t.status || 'Pending'}</span>
                            <span class="text-[10px] text-slate-500 font-mono">${dateStr}</span>
                        </div>
                    </div>
                    
                    <p class="text-slate-200 mt-1"><span class="text-slate-400 font-semibold">Your Message:</span> ${t.message}</p>
                    
                    ${t.admin_response ? `
                        <div class="mt-3 bg-indigo-950/50 border border-indigo-700/60 p-3 rounded-lg text-indigo-100 space-y-1">
                            <p class="font-extrabold text-[11px] text-indigo-300 flex items-center gap-1">
                                🛡️ System Owner / Admin Reply:
                            </p>
                            <p class="text-slate-200 text-xs pl-1">${t.admin_response}</p>
                        </div>
                    ` : `
                        <div class="text-[11px] text-amber-400/80 italic mt-2 flex items-center gap-1">
                            ⏳ Status: Pending response from system management...
                        </div>
                    `}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.warn('Error fetching user tickets:', err);
        container.innerHTML = `<p class="text-xs text-rose-400 text-center py-4">Failed to load tickets: ${err.message || 'Database error'}</p>`;
    }
};

// 6. Owner Inbox Renderer
window.loadHelpTickets = async function() {
    const tbody = document.getElementById('help-tickets-tbody');
    if (!tbody) return;

    try {
        const { data: tickets, error: ticketErr } = await supabaseClient
            .from('help_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (ticketErr) throw ticketErr;

        if (!tickets || tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-500">No suggestions or complaints submitted yet.</td></tr>`;
            return;
        }

        const { data: profiles } = await supabaseClient.from('profiles').select('*');

        const profileMapById = {};
        const profileMapByEmail = {};
        if (profiles) {
            profiles.forEach(p => {
                if (p.id && isValidUUID(p.id)) profileMapById[String(p.id)] = p;
                if (p.email) profileMapByEmail[p.email.toLowerCase().trim()] = p;
            });
        }

        tbody.innerHTML = tickets.map(t => {
            const dateStr = new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const statusBadge = t.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

            const emailClean = (t.user_email || '').toLowerCase().trim();
            const matchedProfile = (t.user_id ? profileMapById[String(t.user_id)] : null) || profileMapByEmail[emailClean];

            // Primary: Submitted Ticket Name
            let resolvedName = t.user_name && !['Registered User', 'User', 'Anonymous User', 'Anonymous', 'Guest User', 'N/A'].includes(t.user_name.trim()) ? t.user_name : null;
            
            // Secondary: Profile Lookup
            if (!resolvedName && matchedProfile) {
                resolvedName = matchedProfile.name || matchedProfile.full_name || matchedProfile.username;
            }

            // Tertiary: Parse Email String
            if (!resolvedName && t.user_email && !['N/A', 'No Email'].includes(t.user_email)) {
                resolvedName = t.user_email.split('@')[0];
            }

            // Fallback
            if (!resolvedName) resolvedName = 'Registered User';

            const resolvedEmail = (t.user_email && !['N/A', 'No Email'].includes(t.user_email)) ? t.user_email : (matchedProfile?.email || 'No Email');
            const resolvedPhone = (t.phone_number && !['N/A', 'No Phone'].includes(t.phone_number)) ? t.phone_number : (matchedProfile?.phone || matchedProfile?.phone_number || 'No Phone');

            return `
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                    <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">${dateStr}</td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-white text-xs">${resolvedName}</div>
                        <div class="text-indigo-300 text-[11px] font-mono">${resolvedEmail}</div>
                        <div class="text-slate-400 text-[10px] font-mono">📞 ${resolvedPhone}</div>
                    </td>
                    <td class="py-3 px-4 font-semibold text-indigo-300">${t.category}</td>
                    <td class="py-3 px-4 text-slate-200 max-w-xs break-words">${t.message}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${statusBadge}">${t.status || 'Pending'}</span>
                        ${t.admin_response ? `<div class="text-[10px] text-slate-400 mt-1.5 max-w-xs italic border-l-2 border-indigo-500 pl-1.5">💬 ${t.admin_response}</div>` : ''}
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="replyToTicket('${t.id}')" class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors block">
                            💬 Reply
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.warn('Error loading inbox tickets:', err);
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-rose-400">Failed to load inbox.</td></tr>`;
    }
};

// 7. Global Ticket Reply Action Handler
window.replyToTicket = async function(ticketId) {
    const response = prompt("Enter your reply message:");
    if (!response || !response.trim()) return;

    try {
        const { error } = await supabaseClient
            .from('help_tickets')
            .update({ 
                admin_response: response.trim(), 
                status: 'Resolved' 
            })
            .eq('id', ticketId);

        if (error) throw error;

        alert("✅ Reply submitted successfully!");
        if (typeof window.loadHelpTickets === 'function') {
            window.loadHelpTickets();
        } else {
            location.reload();
        }
    } catch (err) {
        console.error("Error sending reply:", err);
        alert("Failed to send reply: " + (err.message || "Database error"));
    }
};

// ==========================================
// REPORT CARD GENERATOR & UTILITIES
// ==========================================

async function loadStudentsForReport(classCode) {
  const select = document.getElementById(classCode ? 'reportStudentSelect_' + classCode : 'reportStudentSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Loading enrolled students...</option>';

  try {
    let enrolledEmails = [];
    if (classCode) {
      const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments')
        .select('student_email')
        .eq('class_code', classCode);

      if (!enrollError && enrollments && enrollments.length > 0) {
        enrolledEmails = enrollments.map(e => e.student_email).filter(Boolean);
      }
    }

    let query = supabaseClient.from('profiles').select('id, full_name, name, email, role, position');

    if (enrolledEmails.length > 0) {
      query = query.in('email', enrolledEmails);
    }

    const { data: students, error } = await query;

    if (error || !students || students.length === 0) {
      let markQuery = supabaseClient.from('student_marks').select('student_id, student_email').not('student_id', 'is', null);
      const { data: marksStudents } = await markQuery;

      if (!marksStudents || marksStudents.length === 0) {
        select.innerHTML = '<option value="">No enrolled students found</option>';
        return;
      }

      const uniqueStudentIds = [...new Set(marksStudents.map(m => m.student_id))];
      let optionsHtml = '<option value="">-- Select Student --</option>';
      uniqueStudentIds.forEach(id => {
        const match = marksStudents.find(m => m.student_id === id);
        const name = match ? (match.student_email ? match.student_email.split('@')[0] : 'Student (' + id.substring(0, 5) + ')') : 'Student (' + id.substring(0, 5) + ')';
        optionsHtml += '<option value="' + id + '" data-name="' + name + '">' + name + '</option>';
      });
      select.innerHTML = optionsHtml;
      return;
    }

    let optionsHtml = '<option value="">-- Select Student --</option>';
    students.forEach(s => {
      const displayName = s.full_name || s.name || (s.email ? s.email.split('@')[0] : null) || 'Student (' + s.id.substring(0, 5) + ')';
      optionsHtml += '<option value="' + s.id + '" data-name="' + displayName + '" data-email="' + (s.email || '') + '">' + displayName + '</option>';
    });
    select.innerHTML = optionsHtml;

  } catch (err) {
    console.error("Error loading students for report:", err);
    select.innerHTML = '<option value="">Error loading list</option>';
  }
}

async function handleGenerateReport(classCode, className) {
  if (!className) className = "Primary Class";
  const studentSelect = document.getElementById(classCode ? 'reportStudentSelect_' + classCode : 'reportStudentSelect');
  const termSelect = document.getElementById(classCode ? 'reportTerm_' + classCode : 'reportTerm');
  const yearSelect = document.getElementById(classCode ? 'reportYear_' + classCode : 'reportYear');

  if (!studentSelect || !studentSelect.value) {
    alert("Please select a student first.");
    return;
  }

  const studentId = studentSelect.value;
  const selectedOption = studentSelect.options[studentSelect.selectedIndex];
  const studentName = selectedOption.getAttribute('data-name') || selectedOption.text;
  const studentEmail = selectedOption.getAttribute('data-email');
  const selectedTerm = termSelect ? termSelect.value : 'Term 3';
  const selectedYear = yearSelect ? yearSelect.value : '2026';

  let marks = [];

  const res1 = await supabaseClient
    .from('student_marks')
    .select('subject_name, marks_obtained, max_marks')
    .eq('student_id', studentId)
    .eq('term', selectedTerm)
    .eq('academic_year', selectedYear);

  if (!res1.error && res1.data && res1.data.length > 0) {
    marks = res1.data;
  } else if (studentEmail) {
    const res2 = await supabaseClient
      .from('student_marks')
      .select('subject_name, marks_obtained, max_marks')
      .eq('student_email', studentEmail)
      .eq('term', selectedTerm)
      .eq('academic_year', selectedYear);

    if (!res2.error && res2.data && res2.data.length > 0) {
      marks = res2.data;
    }
  }

  if (!marks || marks.length === 0) {
    alert("No marks recorded for " + studentName + " in " + selectedTerm + " (" + selectedYear + ").");
    return;
  }

  await generateReportCard(studentName, className, marks, {
    name: (window.currentUser && window.currentUser.school) ? window.currentUser.school : "SMARTEDU ACADEMY",
    location: (window.currentUser && window.currentUser.school_location) ? window.currentUser.school_location : "NYAGATARE",
    term: selectedTerm,
    year: selectedYear
  });
}

async function generateReportCard(studentName, className, marksArray, schoolDetails) {
  if (!schoolDetails) schoolDetails = {};
  const jsPDFLib = window.jspdf ? (window.jspdf.jsPDF || window.jspdf) : window.jsPDF;

  if (!jsPDFLib) {
    alert("PDF generation engine is not loaded yet. Please refresh the page and try again.");
    return;
  }

  function calculateGrade(score) {
    if (score >= 80) return { grade: 'A', remark: 'Excellent' };
    if (score >= 70) return { grade: 'B', remark: 'Very Good' };
    if (score >= 60) return { grade: 'C', remark: 'Good' };
    if (score >= 50) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
  }

  let totalObtained = 0;
  let totalMax = 0;

  let rowsHtml = '';
  marksArray.forEach(item => {
    const score = Number(item.marks_obtained || item.score || 0);
    const maxMarks = Number(item.max_marks || 100);
    totalObtained += score;
    totalMax += maxMarks;

    const res = calculateGrade(score);

    rowsHtml += '<tr style="border-bottom: 1px solid #cbd5e1;">' +
      '<td style="padding: 10px; font-weight: 500; text-align: left;">' + (item.subject_name || 'Subject') + '</td>' +
      '<td style="padding: 10px; text-align: center;">' + maxMarks + '</td>' +
      '<td style="padding: 10px; text-align: center; font-weight: bold;">' + score + '</td>' +
      '<td style="padding: 10px; text-align: center; font-weight: bold; color: #16a34a;">' + res.grade + '</td>' +
      '<td style="padding: 10px; text-align: left; font-style: italic;">' + res.remark + '</td>' +
      '</tr>';
  });

  const averagePercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
  const overallGrade = calculateGrade(averagePercentage);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '700px';
  container.style.padding = '30px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Arial, sans-serif';

  container.innerHTML = 
    '<div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px;">' +
      '<h1 style="margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase;">' + (schoolDetails.name || 'SMARTEDU ACADEMY') + '</h1>' +
      '<p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Location: ' + (schoolDetails.location || 'NYAGATARE, RWANDA') + '</p>' +
      '<h2 style="margin: 12px 0 0 0; font-size: 16px; color: #16a34a; text-transform: uppercase;">STUDENT PROGRESS REPORT CARD</h2>' +
    '</div>' +
    '<div style="background-color: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
        '<div><strong>Student Name:</strong> ' + studentName + '</div>' +
        '<div><strong>Academic Year:</strong> ' + (schoolDetails.year || '2026') + '</div>' +
        '<div><strong>Class / Level:</strong> ' + className + '</div>' +
        '<div><strong>Term:</strong> ' + (schoolDetails.term || 'Term 3') + '</div>' +
      '</div>' +
    '</div>' +
    '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">' +
      '<thead>' +
        '<tr style="background-color: #16a34a; color: #ffffff;">' +
          '<th style="padding: 10px; text-align: left;">Subject</th>' +
          '<th style="padding: 10px; text-align: center;">Max Score</th>' +
          '<th style="padding: 10px; text-align: center;">Score Obtained</th>' +
          '<th style="padding: 10px; text-align: center;">Grade</th>' +
          '<th style="padding: 10px; text-align: left;">Remarks</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table>' +
    '<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 35px; display: flex; justify-content: space-between;">' +
      '<div><strong>Total Marks:</strong> ' + totalObtained + ' / ' + totalMax + '</div>' +
      '<div><strong>Average:</strong> ' + averagePercentage + '%</div>' +
      '<div><strong>Overall Decision:</strong> <span style="color: #16a34a; font-weight: bold;">' + overallGrade.grade + ' (' + overallGrade.remark + ')</span></div>' +
    '</div>' +
    '<div style="display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px;">' +
      '<div style="text-align: center;">' +
        '<p style="margin-bottom: 35px;">___________________________</p>' +
        '<p><strong>Class Teacher Signature</strong></p>' +
      '</div>' +
      '<div style="text-align: center;">' +
        '<p style="margin-bottom: 35px;">___________________________</p>' +
        '<p><strong>Headmaster Stamp & Signature</strong></p>' +
      '</div>' +
    '</div>';

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDFLib('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(studentName.replace(/\s+/g, '_') + '_ReportCard.pdf');
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to create PDF. Please check browser permissions and try again.");
  } finally {
    document.body.removeChild(container);
  }
}

// Global scope attachments
window.loadStudentsForReport = loadStudentsForReport;
window.handleGenerateReport = handleGenerateReport;
window.generateReportCard = generateReportCard;
