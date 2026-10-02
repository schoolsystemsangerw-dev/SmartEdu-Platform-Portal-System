const SUPABASE_URL="https://ggiwmwinrcxrkqcevqnz.supabase.co",SUPABASE_KEY="sb_publishable_SYYnHD1Ws3cz5lva25quxQ_ey7XgL4v",supabaseClient=window.supabase.createClient("https://ggiwmwinrcxrkqcevqnz.supabase.co","sb_publishable_SYYnHD1Ws3cz5lva25quxQ_ey7XgL4v");function getDirectImageUrl(e){if(!e)return"";let t=e.trim();if(t.includes("drive.google.com/file/d/")){let s=t.split("/d/")[1].split("/")[0];return`https://lh3.googleusercontent.com/d/${s}=s220`}return t.includes("dropbox.com")?t.replace("www.dropbox.com","dl.dropboxusercontent.com").replace("?dl=0",""):/^https?:\/\//i.test(t)?t:"https://"+t}const Session={getUser(){let e=localStorage.getItem("portal_current_user")||localStorage.getItem("currentUser");return e?JSON.parse(e):null},setUser(e){localStorage.setItem("portal_current_user",JSON.stringify(e)),localStorage.setItem("currentUser",JSON.stringify(e))},clear(){localStorage.removeItem("portal_current_user"),localStorage.removeItem("currentUser")}};let currentUser=Session.getUser(),jitsiApi=null;const MASTER_ADMIN_EMAIL="schoolsystems.ange.rw@gmail.com";async function checkSession(){currentUser=Session.getUser();let e=document.getElementById("user-badge"),t=document.getElementById("auth-status"),s=document.getElementById("logout-btn");if(currentUser){let{data:a}=await supabaseClient.from("profiles").select("*").eq("email",currentUser.email).maybeSingle();if(a&&(currentUser=a,Session.setUser(a)),e&&(e.classList.remove("hidden"),e.classList.add("flex")),t){let r=currentUser.email.toLowerCase()===MASTER_ADMIN_EMAIL?"SYSTEM OWNER":currentUser.role.toUpperCase();t.textContent=`${currentUser.name} (${r})`}if(s&&s.classList.remove("hidden"),"teacher"===currentUser.role&&"pending"===currentUser.account_status){alert("Your account is awaiting payment verification by the System Owner."),Session.clear(),checkSession();return}currentUser.email.toLowerCase()===MASTER_ADMIN_EMAIL?showRoleDashboard("owner"):showRoleDashboard(currentUser.role)}else e&&e.classList.add("hidden"),s&&s.classList.add("hidden"),showAuthSection()}function hideAllSections(){["auth-section","owner-dashboard","head-teacher-dashboard","teacher-dashboard","student-dashboard"].forEach(e=>{let t=document.getElementById(e);t&&t.classList.add("hidden")})}function showAuthSection(){hideAllSections();let e=document.getElementById("auth-section");e&&e.classList.remove("hidden")}function showRoleDashboard(e){hideAllSections();let t=Session.getUser()||JSON.parse(localStorage.getItem("currentUser")||"{}"),s=t&&t.role?t.role:void 0!==e?e:"";if("owner"===s){let a=document.getElementById("owner-dashboard");a&&a.classList.remove("hidden"),"function"==typeof renderOwnerDashboard&&renderOwnerDashboard()}else if("head-teacher"===s){let r=document.getElementById("head-teacher-dashboard");r&&r.classList.remove("hidden"),"function"==typeof renderHeadTeacherDashboard?renderHeadTeacherDashboard():"function"==typeof loadHeadTeacherData&&loadHeadTeacherData()}else if("teacher"===s){let l=document.getElementById("teacher-dashboard");l&&l.classList.remove("hidden"),"function"==typeof renderTeacherDashboard&&renderTeacherDashboard()}else if("student"===s){let n=document.getElementById("student-dashboard");n&&n.classList.remove("hidden"),"function"==typeof renderStudentDashboard&&renderStudentDashboard()}}function setupAuthTabs(){let e=document.getElementById("tab-login"),t=document.getElementById("tab-register"),s=document.getElementById("login-form"),a=document.getElementById("register-form"),r=document.getElementById("reg-role"),l=document.getElementById("teacher-fields");e&&t&&(e.addEventListener("click",()=>{e.className="flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md",t.className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition",s&&s.classList.remove("hidden"),a&&a.classList.add("hidden")}),t.addEventListener("click",()=>{t.className="flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md",e.className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition",a&&a.classList.remove("hidden"),s&&s.classList.add("hidden")})),r&&l&&r.addEventListener("change",e=>{let t=e.target.value;if("teacher"===t||"head-teacher"===t){l.classList.remove("hidden");let s=document.getElementById("reg-position");s&&(s.value="head-teacher"===t?"Head Teacher":"Teacher")}else l.classList.add("hidden")})}function setupEventListeners(){let e=document.getElementById("register-form");e&&e.addEventListener("submit",async t=>{t.preventDefault();let s=document.getElementById("reg-role")?.value||"",a=document.getElementById("reg-name")?.value||"",r=document.getElementById("reg-email")?.value||"",l=document.getElementById("reg-phone")?.value||"",n=document.getElementById("reg-password")?.value||"";if(!r||!a){alert("Please enter your name and email address.");return}let{data:o}=await supabaseClient.from("profiles").select("email").eq("email",r).maybeSingle();if(o){alert("An account with this email already exists.");return}let i="teacher"===s||"head-teacher"===s,d=i&&document.getElementById("reg-school-logo")?.value||"",c=r.toLowerCase()===MASTER_ADMIN_EMAIL?"owner":s,m={role:c,name:a,full_name:a,email:r,phone:l,phone_number:l,password:n,account_status:i?"pending":"active",school:i&&document.getElementById("reg-school")?.value||"",school_location:i&&document.getElementById("reg-school-location")?.value||"",position:i&&document.getElementById("reg-position")?.value||"",school_logo_url:getDirectImageUrl(d),payment_ref:i&&document.getElementById("reg-payment-ref")?.value||""},{data:p,error:u}=await supabaseClient.from("profiles").insert([m]).select();if(u){alert("Registration failed: "+u.message);return}let $=p&&p[0]?p[0]:m;localStorage.setItem("currentUser",JSON.stringify($)),localStorage.setItem("user",JSON.stringify($)),window.currentUserProfile=$,i?alert("Staff/Head Teacher account registered! Pending payment approval by System Owner."):alert("Account created successfully! You can now log in."),e.reset(),document.getElementById("tab-login")?.click()});let t=document.getElementById("login-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();let t=document.getElementById("login-email").value,s=document.getElementById("login-password").value,{data:a,error:r}=await supabaseClient.from("profiles").select("*").eq("email",t).eq("password",s).maybeSingle();if(r||!a){alert("Invalid email or password.");return}if(("teacher"===a.role||"head-teacher"===a.role)&&"pending"===a.account_status){alert("Your account is pending payment verification by the System Owner. Please contact schoolsystems.ange.rw@gmail.com.");return}Session.setUser(a),checkSession()});let s=document.getElementById("logout-btn");s&&s.addEventListener("click",()=>{Session.clear(),checkSession()});let a=document.getElementById("create-class-form");a&&a.addEventListener("submit",async e=>{e.preventDefault();let t=document.getElementById("class-name").value,s=document.getElementById("class-subject").value,a=s.substring(0,3).toUpperCase()+"-"+Math.floor(1e3+9e3*Math.random()),r={teacher_email:currentUser.email,class_name:t,subject:s,class_code:a},{error:l}=await supabaseClient.from("classes").insert([r]);if(l){alert("Error creating class: "+l.message);return}e.target.reset(),renderTeacherDashboard()});let r=document.getElementById("join-class-form");r&&r.addEventListener("submit",async e=>{e.preventDefault();let t=document.getElementById("join-class-code")||document.getElementById("join-code"),s=t?t.value.trim().toUpperCase():"";if(!s){alert("Please enter a valid class code.");return}let{data:a,error:r}=await supabaseClient.from("classes").select("*").eq("class_code",s).maybeSingle();if(r||!a){alert("Invalid Class Code! Please check the code with your teacher.");return}let{error:l}=await supabaseClient.from("enrollments").insert([{student_email:currentUser.email,class_code:s}]);if(l){"23505"===l.code?alert("You have already joined this class!"):alert("Failed to join class: "+l.message);return}alert("Successfully joined "+a.class_name+"!"),t&&(t.value=""),renderStudentDashboard()})}async function renderOwnerDashboard(){let e=document.getElementById("owner-pending-list");if(!e)return;let{data:t,error:s}=await supabaseClient.from("profiles").select("*").eq("account_status","pending");if(s||!t||0===t.length){e.innerHTML='<p class="text-xs text-slate-500 italic py-4 text-center">No pending teacher or head teacher payment approvals.</p>';return}e.innerHTML=t.map(e=>{let t=getDirectImageUrl(e.school_logo_url),s="head-teacher"===e.role?"Head Teacher":e.position||"Teacher";return`
            <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex items-start gap-3">
                    ${t?`
                        <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                            <img src="${t}" 
                                 alt="School Logo" 
                                 class="w-full h-full object-contain rounded-lg"
                                 onerror="this.onerror=null; this.parentElement.style.display='none';" />
                        </div>
                    `:""}
                    <div class="space-y-1">
                        <h4 class="font-bold text-sm text-white">${e.name} <span class="text-xs font-normal text-indigo-400">(${s})</span></h4>
                        <p class="text-xs text-indigo-300 font-semibold">${e.school||"Unspecified School"} ${e.school_location?`• ${e.school_location}`:""}</p>
                        <p class="text-xs text-slate-400">Phone: <span class="text-slate-200 font-mono">${e.phone||"N/A"}</span> | Email: ${e.email}</p>
                        <p class="text-xs font-bold text-amber-400">MoMo Ref ID: ${e.payment_ref||"N/A"}</p>
                    </div>
                </div>
                <button onclick="window.approveUser('${e.email}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 self-end md:self-center">
                    Approve Payment
                </button>
            </div>
        `}).join("")}async function renderTeacherDashboard(){let e=document.getElementById("teacher-classes-cards");if(!e)return;let t=Session.getUser()||JSON.parse(localStorage.getItem("currentUser")||"{}"),{data:s,error:a}=await supabaseClient.from("classes").select("*").eq("teacher_email",t?.email);if(a||!s||0===s.length){e.innerHTML='<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">No classes created yet. Fill out the form on the left to create your first class.</p>';return}let{data:r}=await supabaseClient.from("exams").select("*").eq("teacher_email",t?.email),l=getDirectImageUrl(t?.school_logo_url);e.innerHTML=s.map(e=>{let s=r?r.filter(t=>t.class_code===e.class_code):[];return`
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${e.class_name||e.name||"Class"}</h4>
                            <p class="text-xs text-slate-400">${e.subject||""}</p>
                        </div>
                        ${l?`
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${l}" 
                                   alt="School Logo" 
                                   class="w-full h-full object-contain rounded-lg"
                                   onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        `:""}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">School:</span> ${t?.school||"N/A"} ${t?.school_location?`(${t.school_location})`:""}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${t?.name||"Teacher"} (${t?.position||"Teacher"})</p>
                        <p class="text-slate-300"><span class="text-slate-500">Phone:</span> <span class="font-mono text-indigo-300">${t?.phone||"N/A"}</span></p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${e.class_code}</span>
                    </div>
                </div>

                <!-- Live Stream & Exam Controls -->
                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${e.class_code}', '${e.class_name||e.name}')" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="video" class="w-4 h-4"></i> Start Live Class / Screen Share
                    </button>

                    <button onclick="window.openCreateExamModal('${e.class_code}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="file-plus" class="w-4 h-4"></i> Create / Load Exam
                    </button>

                    ${s.map(e=>`
                        <button onclick="window.viewExamResults(${e.id})" class="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold rounded-xl text-[11px] transition flex items-center justify-between px-3">
                            <span class="truncate">📊 ${e.title||e.exam_title||"Exam"} Results</span>
                            <span class="text-emerald-400 font-bold">View Marks</span>
                        </button>
                    `).join("")}

                    <!-- REPORT CARD GENERATOR SECTION -->
                    <div class="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                        <h5 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <i data-lucide="file-text" class="w-3.5 h-3.5 text-emerald-400"></i> Generate Student Report Card
                        </h5>

                        <div class="space-y-2">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[10px] text-slate-400 font-medium mb-1">Academic Year</label>
                                    <select id="reportYear_${e.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                        <option value="2026" selected>2026</option>
                                        <option value="2025">2025</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] text-slate-400 font-medium mb-1">Term</label>
                                    <select id="reportTerm_${e.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3" selected>Term 3</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Select Student</label>
                                <select id="reportStudentSelect_${e.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                </select>
                            </div>

                            <button onclick="handleGenerateReport('${e.class_code}', '${e.class_name||e.name||"Class"}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Report Card (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join(""),window.lucide&&lucide.createIcons(),s.forEach(e=>{"function"==typeof loadStudentsForReport&&loadStudentsForReport(e.class_code)})}async function renderStudentDashboard(){let e=document.getElementById("student-classes-cards");if(!e)return;let{data:t,error:s}=await supabaseClient.from("enrollments").select("class_code").eq("student_email",currentUser?.email);if(s||!t||0===t.length){e.innerHTML='<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">You haven\'t joined any classes yet. Enter a code above to get started.</p>';return}let a=t.map(e=>e.class_code),{data:r,error:l}=await supabaseClient.from("classes").select("*").in("class_code",a);if(l||!r||0===r.length)return;let{data:n}=await supabaseClient.from("exams").select("*").in("class_code",a),{data:o}=await supabaseClient.from("submissions").select("*").eq("student_email",currentUser?.email),i=[...new Set(r.map(e=>e.teacher_email))],{data:d}=await supabaseClient.from("profiles").select("*").in("email",i),c={};d&&d.forEach(e=>{c[e.email]=e}),e.innerHTML=r.map(e=>{let t=c[e.teacher_email]||{},s=getDirectImageUrl(t.school_logo_url),a=n?n.filter(t=>t.class_code===e.class_code):[];return`
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${e.class_name||e.name||"Class"}</h4>
                            <p class="text-xs text-slate-400">${e.subject||""}</p>
                        </div>
                        ${s?`
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${s}" 
                                     alt="School Logo" 
                                     class="w-full h-full object-contain rounded-lg"
                                     onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        `:""}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">School:</span> ${t.school||"N/A"} ${t.school_location?`(${t.school_location})`:""}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${t.name||"N/A"} ${t.position?`(${t.position})`:""}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Phone:</span> <span class="font-mono text-indigo-300">${t.phone||"N/A"}</span></p>
                        <p class="text-slate-300"><span class="text-slate-500">Email:</span> ${t.email||e.teacher_email}</p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${e.class_code}</span>
                    </div>
                </div>

                <!-- Live Stream & Student Exam Buttons -->
                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${e.class_code}', '${e.class_name||e.name}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md">
                        <i data-lucide="video" class="w-4 h-4"></i> Join Live Class
                    </button>

                    ${a.map(e=>{let t=o?o.find(t=>t.exam_id===e.id):null;return t?`
                                <button onclick="window.viewStudentMarkingGuide(${e.id})" class="w-full py-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs px-3 flex justify-between items-center font-semibold transition">
                                    <span class="flex items-center gap-1.5"><i data-lucide="file-check" class="w-4 h-4 text-emerald-400"></i> ${e.title}</span>
                                    <span class="font-mono font-bold text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">${t.score_obtained}/${e.total_marks} (${t.percentage}%) - Guide</span>
                                </button>
                            `:`
                                <button onclick="window.openStudentExam(${e.id})" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-between px-3 shadow-md">
                                    <span class="flex items-center gap-1.5"><i data-lucide="edit-3" class="w-4 h-4"></i> ${e.title}</span>
                                    <span class="bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-200 border border-emerald-700/80">⏱️ ${e.duration_minutes}m | ${e.total_marks} pts</span>
                                </button>
                            `}).join("")}

                    <!-- STUDENT REPORT CARD GENERATOR SECTION -->
                    <div class="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                        <h5 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <i data-lucide="award" class="w-3.5 h-3.5 text-emerald-400"></i> My Report Card
                        </h5>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Academic Year</label>
                                <select id="studentReportYear_${e.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="2026" selected>2026</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] text-slate-400 font-medium mb-1">Term</label>
                                <select id="studentReportTerm_${e.class_code}" class="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none">
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3" selected>Term 3</option>
                                </select>
                            </div>
                        </div>

                        <button onclick="downloadMyReportCard('${e.class_code}', '${e.class_name||e.name||"Class"}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i> Download My Report Card (PDF)
                        </button>
                    </div>
                </div>
            </div>
        `}).join(""),window.lucide&&lucide.createIcons()}async function downloadMyReportCard(e,t){let s=document.getElementById(`studentReportTerm_${e}`),a=document.getElementById(`studentReportYear_${e}`),r=s?s.value:"Term 3",l=a?a.value:"2026",n=currentUser?.name||currentUser?.full_name||"Student",{data:o,error:i}=await supabaseClient.from("student_marks").select("subject_name, marks_obtained, max_marks").eq("student_email",currentUser?.email).eq("term",r).eq("academic_year",l);if(i||!o||0===o.length){alert(`No marks recorded for ${r} (${l}).`);return}await generateReportCard(n,t,o,{name:currentUser?.school||"SMARTEDU ACADEMY",location:currentUser?.school_location||"NYAGATARE",term:r,year:l})}function isValidUUID(e){return!!e&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(e).trim())}async function loadStudentsForReport(e){let t=document.getElementById(e?"reportStudentSelect_"+e:"reportStudentSelect");if(t){t.innerHTML='<option value="">Loading enrolled students...</option>';try{let s=[];if(e){let{data:a,error:r}=await supabaseClient.from("enrollments").select("student_email").eq("class_code",e);!r&&a&&a.length>0&&(s=a.map(e=>e.student_email).filter(Boolean))}let l=supabaseClient.from("profiles").select("id, full_name, name, email, role, position");s.length>0&&(l=l.in("email",s));let{data:n,error:o}=await l;if(o||!n||0===n.length){let i=supabaseClient.from("student_marks").select("student_id, student_email").not("student_id","is",null),{data:d}=await i;if(!d||0===d.length){t.innerHTML='<option value="">No enrolled students found</option>';return}let c=[...new Set(d.map(e=>e.student_id))],m='<option value="">-- Select Student --</option>';c.forEach(e=>{let t=d.find(t=>t.student_id===e),s=t&&t.student_email?t.student_email.split("@")[0]:"Student ("+e.substring(0,5)+")";m+='<option value="'+e+'" data-name="'+s+'">'+s+"</option>"}),t.innerHTML=m;return}let p='<option value="">-- Select Student --</option>';n.forEach(e=>{let t=e.full_name||e.name||(e.email?e.email.split("@")[0]:null)||"Student ("+e.id.substring(0,5)+")";p+='<option value="'+e.id+'" data-name="'+t+'" data-email="'+(e.email||"")+'">'+t+"</option>"}),t.innerHTML=p}catch(u){console.error("Error loading students for report:",u),t.innerHTML='<option value="">Error loading list</option>'}}}async function handleGenerateReport(e,t){t||(t="Primary Class");let s=document.getElementById(e?"reportStudentSelect_"+e:"reportStudentSelect"),a=document.getElementById(e?"reportTerm_"+e:"reportTerm"),r=document.getElementById(e?"reportYear_"+e:"reportYear");if(!s||!s.value){alert("Please select a student first.");return}let l=s.value,n=s.options[s.selectedIndex],o=n.getAttribute("data-name")||n.text,i=n.getAttribute("data-email"),d=a?a.value:"Term 3",c=r?r.value:"2026",m=[],p=await supabaseClient.from("student_marks").select("subject_name, marks_obtained, max_marks").eq("student_id",l).eq("term",d).eq("academic_year",c);if(!p.error&&p.data&&p.data.length>0)m=p.data;else if(i){let u=await supabaseClient.from("student_marks").select("subject_name, marks_obtained, max_marks").eq("student_email",i).eq("term",d).eq("academic_year",c);!u.error&&u.data&&u.data.length>0&&(m=u.data)}if(!m||0===m.length){alert("No marks recorded for "+o+" in "+d+" ("+c+").");return}await generateReportCard(o,t,m,{name:window.currentUser&&window.currentUser.school?window.currentUser.school:"SMARTEDU ACADEMY",location:window.currentUser&&window.currentUser.school_location?window.currentUser.school_location:"NYAGATARE",term:d,year:c})}async function generateReportCard(e,t,s,a){a||(a={});let r=window.jspdf?window.jspdf.jsPDF||window.jspdf:window.jsPDF;if(!r){alert("PDF generation engine is not loaded yet. Please refresh the page and try again.");return}function l(e){return e>=80?{grade:"A",remark:"Excellent"}:e>=70?{grade:"B",remark:"Very Good"}:e>=60?{grade:"C",remark:"Good"}:e>=50?{grade:"D",remark:"Pass"}:{grade:"F",remark:"Fail"}}let n=0,o=0,i="";s.forEach(e=>{let t=Number(e.marks_obtained||e.score||0),s=Number(e.max_marks||100);n+=t,o+=s;let a=l(t);i+='<tr style="border-bottom: 1px solid #cbd5e1;"><td style="padding: 10px; font-weight: 500; text-align: left;">'+(e.subject_name||"Subject")+'</td><td style="padding: 10px; text-align: center;">'+s+'</td><td style="padding: 10px; text-align: center; font-weight: bold;">'+t+'</td><td style="padding: 10px; text-align: center; font-weight: bold; color: #16a34a;">'+a.grade+'</td><td style="padding: 10px; text-align: left; font-style: italic;">'+a.remark+"</td></tr>"});let d=o>0?(n/o*100).toFixed(1):0,c=l(d),m=document.createElement("div");m.style.position="absolute",m.style.left="-9999px",m.style.width="700px",m.style.padding="30px",m.style.backgroundColor="#ffffff",m.style.color="#0f172a",m.style.fontFamily="Arial, sans-serif",m.innerHTML='<div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px;"><h1 style="margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase;">'+(a.name||"SMARTEDU ACADEMY")+'</h1><p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Location: '+(a.location||"NYAGATARE, RWANDA")+'</p><h2 style="margin: 12px 0 0 0; font-size: 16px; color: #16a34a; text-transform: uppercase;">STUDENT PROGRESS REPORT CARD</h2></div><div style="background-color: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; font-size: 13px;"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"><div><strong>Student Name:</strong> '+e+"</div><div><strong>Academic Year:</strong> "+(a.year||"2026")+"</div><div><strong>Class / Level:</strong> "+t+"</div><div><strong>Term:</strong> "+(a.term||"Term 3")+'</div></div></div><table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;"><thead><tr style="background-color: #16a34a; color: #ffffff;"><th style="padding: 10px; text-align: left;">Subject</th><th style="padding: 10px; text-align: center;">Max Score</th><th style="padding: 10px; text-align: center;">Score Obtained</th><th style="padding: 10px; text-align: center;">Grade</th><th style="padding: 10px; text-align: left;">Remarks</th></tr></thead><tbody>'+i+'</tbody></table><div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 35px; display: flex; justify-content: space-between;"><div><strong>Total Marks:</strong> '+n+" / "+o+"</div><div><strong>Average:</strong> "+d+'%</div><div><strong>Overall Decision:</strong> <span style="color: #16a34a; font-weight: bold;">'+c.grade+" ("+c.remark+')</span></div></div><div style="display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px;"><div style="text-align: center;"><p style="margin-bottom: 35px;">___________________________</p><p><strong>Class Teacher Signature</strong></p></div><div style="text-align: center;"><p style="margin-bottom: 35px;">___________________________</p><p><strong>Headmaster Stamp & Signature</strong></p></div></div>',document.body.appendChild(m);try{let p=await html2canvas(m,{scale:2,useCORS:!0}),u=p.toDataURL("image/png"),$=new r("p","mm","a4"),x=$.internal.pageSize.getWidth(),b=p.height*x/p.width;$.addImage(u,"PNG",0,0,x,b),$.save(e.replace(/\s+/g,"_")+"_ReportCard.pdf")}catch(g){console.error("PDF generation failed:",g),alert("Failed to create PDF. Please check browser permissions and try again.")}finally{document.body.removeChild(m)}}function switchHtTab(e){["overview","staff","academics","reports"].forEach(t=>{let s=document.getElementById(`ht-tab-content-${t}`),a=document.getElementById(`btn-ht-${t}`);s&&(t===e?s.classList.remove("hidden"):s.classList.add("hidden")),a&&(t===e?a.className="w-full text-left px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/20 transition flex items-center space-x-3 text-sm":a.className="w-full text-left px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white font-medium transition flex items-center space-x-3 text-sm")}),"academics"===e?renderHtAcademics():"reports"===e&&renderOfficialReports()}async function renderHeadTeacherDashboard(){let e=document.getElementById("head-teacher-dashboard");if(!e||e.classList.contains("hidden")){console.log("Aborted renderHeadTeacherDashboard: Not currently viewing Head Teacher dashboard.");return}let t=document.getElementById("ht-staff-list");if(!t)return;let s=Session.getUser()||JSON.parse(localStorage.getItem("currentUser")||"{}");console.log("Current Logged-in User:",s);let a=s.school||"";if(a){let r=document.getElementById("ht-school-title");r&&(r.textContent=a)}try{let{data:l,error:n}=await supabaseClient.from("profiles").select("*");if(console.log("All Profiles fetched from Supabase:",l),n)throw n;if(!l||0===l.length){console.log("No profiles found."),t.innerHTML='<p class="text-slate-400 py-4">No profiles found in the database table.</p>';return}let o=a?l.filter(e=>!e.school||e.school.trim().toLowerCase()===a.trim().toLowerCase()):l,i=o.filter(e=>"teacher"===e.role||"owner"===e.role||"head-teacher"===e.role),d=o.filter(e=>"student"===e.role),c=o.filter(e=>"pending"===e.account_status).length,m=document.getElementById("ht-total-teachers");m&&(m.textContent=i.length);let p=document.getElementById("ht-total-students");p&&(p.textContent=d.length);let u=document.getElementById("ht-pending-approvals");u&&(u.textContent=c);let $=`
            <!-- Teachers & Staff Section -->
            <div class="mb-8">
                <h3 class="text-white font-semibold text-lg mb-4">Registered Teachers & Staff (${i.length})</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                                <th class="py-3 px-4 font-semibold">Staff Member</th>
                                <th class="py-3 px-4 font-semibold">Role</th>
                                <th class="py-3 px-4 font-semibold">Email Address</th>
                                <th class="py-3 px-4 font-semibold">Status</th>
                                <th class="py-3 px-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
        `;i.forEach(e=>{let t="pending"===e.account_status;$+=`
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3.5 px-4 font-medium text-white">${e.name||e.full_name||"N/A"}</td>
                    <td class="py-3.5 px-4 capitalize text-slate-300">${e.role}</td>
                    <td class="py-3.5 px-4 text-slate-400">${e.email||"N/A"}</td>
                    <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${t?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}">
                            ${e.account_status||"active"}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        ${t?`
                            <button onclick="approveStaff('${e.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition">
                                Approve
                            </button>
                        `:`
                            <span class="text-xs text-slate-500 font-medium">Verified</span>
                        `}
                    </td>
                </tr>
            `}),$+="</tbody></table></div></div>",$+=`
            <div>
                <h3 class="text-white font-semibold text-lg mb-4">Registered Students (${d.length})</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                                <th class="py-3 px-4 font-semibold">Student Name</th>
                                <th class="py-3 px-4 font-semibold">Email</th>
                                <th class="py-3 px-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
        `,d.forEach(e=>{$+=`
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 px-4 font-medium text-white">${e.name||e.full_name||"N/A"}</td>
                    <td class="py-3 px-4 text-slate-300">${e.email||"N/A"}</td>
                    <td class="py-3 px-4 text-right">
                        <span class="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 font-medium">Active Student</span>
                    </td>
                </tr>
            `}),$+="</tbody></table></div></div>",t.innerHTML=$}catch(x){console.error("Error fetching dashboard data from Supabase:",x)}}async function approveStaff(e){let{error:t}=await supabaseClient.from("profiles").update({account_status:"active"}).eq("id",e);if(t){alert("Failed to approve account: "+t.message);return}alert("Staff account approved successfully!"),renderHeadTeacherDashboard()}async function renderHtAcademics(){let e=document.getElementById("ht-academics-container");if(e){e.innerHTML='<div class="text-slate-400 py-8 text-center text-sm">Loading exams and student submissions from Supabase...</div>';try{let{data:t,error:s}=await supabaseClient.from("exams").select("*");if(s)throw s;let{data:a,error:r}=await supabaseClient.from("submissions").select("*");if(r)throw r;let l="";l+=`
            <div class="mb-8">
                <h3 class="text-white font-semibold text-base mb-3 flex items-center gap-2">
                    <span>📚</span> Loaded Teacher Exams (${t?t.length:0})
                </h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                                <th class="py-3 px-4">Exam Title / Subject</th>
                                <th class="py-3 px-4">Teacher Name & Email</th>
                                <th class="py-3 px-4">Class</th>
                                <th class="py-3 px-4">Date Created</th>
                                <th class="py-3 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-300">
        `,t&&0!==t.length?t.forEach(e=>{let t=e.teacher_name||e.name||e.created_by||"Teacher",s=e.teacher_email||e.email||e.user_email||"No email provided";l+=`
                    <tr class="hover:bg-slate-800/40 transition">
                        <td class="py-3.5 px-4 font-medium text-white">${e.title||e.subject||"Unnamed Exam"}</td>
                        <td class="py-3.5 px-4">
                            <div class="font-medium text-white">${t}</div>
                            <div class="text-xs text-slate-400">${s}</div>
                        </td>
                        <td class="py-3.5 px-4 text-slate-300">${e.class_name||e.class||"N/A"}</td>
                        <td class="py-3.5 px-4 text-slate-400">${e.created_at?new Date(e.created_at).toLocaleDateString():"N/A"}</td>
                        <td class="py-3.5 px-4 text-right">
                            <span class="px-2.5 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 font-semibold">Active</span>
                        </td>
                    </tr>
                `}):l+='<tr><td colspan="5" class="py-6 text-center text-slate-500 text-xs">No exams loaded by teachers yet.</td></tr>',l+="</tbody></table></div></div>",l+=`
            <div>
                <h3 class="text-white font-semibold text-base mb-3 flex items-center gap-2">
                    <span>📊</span> Student Exam Submissions & Marks Obtained (${a?a.length:0})
                </h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                                <th class="py-3 px-4">Student Name & Email</th>
                                <th class="py-3 px-4">Exam ID / Subject</th>
                                <th class="py-3 px-4">Marks Obtained</th>
                                <th class="py-3 px-4 text-right">Submission Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-slate-300">
        `,a&&0!==a.length?a.forEach(e=>{let t=void 0!==e.score_obtained&&null!==e.score_obtained?e.score_obtained:null,s=void 0!==e.total_marks&&null!==e.total_marks?e.total_marks:100,a=void 0!==e.percentage&&null!==e.percentage?e.percentage:null!==t?Math.round(t/s*100):null,r=null!==t?`${t} / ${s} (${a}%)`:"Submitted";l+=`
                    <tr class="hover:bg-slate-800/40 transition">
                        <td class="py-3.5 px-4">
                            <div class="font-medium text-white">${e.student_name||"Unknown Student"}</div>
                            <div class="text-xs text-slate-400">${e.student_email||"No email provided"}</div>
                        </td>
                        <td class="py-3.5 px-4 text-slate-300">Exam ID: ${e.exam_id||"N/A"}</td>
                        <td class="py-3.5 px-4 font-bold text-emerald-400">${r}</td>
                        <td class="py-3.5 px-4 text-right text-slate-400">${e.submitted_at?new Date(e.submitted_at).toLocaleDateString():"N/A"}</td>
                    </tr>
                `}):l+='<tr><td colspan="4" class="py-6 text-center text-slate-500 text-xs">No student exam submissions recorded yet.</td></tr>',l+="</tbody></table></div></div>",e.innerHTML=l}catch(n){console.error("Error loading academic performance:",n),e.innerHTML=`<p class="text-red-400 py-6 text-center text-sm">Failed to load academic data: ${n.message}</p>`}}}async function renderOfficialReports(){let e=document.getElementById("ht-tab-content-reports");if(!e){console.error("Container 'ht-tab-content-reports' not found in HTML!");return}e.innerHTML='<div class="text-slate-400 py-12 text-center text-sm animate-pulse">Fetching live administrative reports from Supabase...</div>';try{let[t,s,a]=await Promise.all([supabaseClient.from("classes").select("*"),supabaseClient.from("enrollments").select("*"),supabaseClient.from("teacher_leave_requests").select("*")]),r=t.data?t.data.length:0,l=s.data?s.data.length:0,n=a.data?a.data.filter(e=>"pending"===e.status).length:0;e.innerHTML=`
            <div class="space-y-6">
                <!-- Header Banner -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h3 class="text-white font-bold text-lg flex items-center gap-2">
                            <span>📑</span> Official Administrative Reports & Audit Center
                        </h3>
                        <p class="text-slate-400 text-sm mt-1">Export official attendance sheets, database summaries, and ministry logs.</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="alert('Exporting PDF Attendance Report...')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20">
                            📄 Export Attendance PDF
                        </button>
                        <button onclick="alert('Generating Ministry Compliance Log...')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700">
                            📊 Ministry Logs
                        </button>
                    </div>
                </div>

                <!-- Live Database Metrics from Supabase -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div class="text-slate-400 text-xs font-medium">Active Classes Recorded</div>
                        <div class="text-2xl font-bold text-white mt-1">${r}</div>
                        <div class="text-emerald-400 text-xs mt-2">Synced from Supabase 'classes'</div>
                    </div>
                    <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div class="text-slate-400 text-xs font-medium">Total Student Enrollments</div>
                        <div class="text-2xl font-bold text-white mt-1">${l}</div>
                        <div class="text-emerald-400 text-xs mt-2">Synced from Supabase 'enrollments'</div>
                    </div>
                    <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div class="text-slate-400 text-xs font-medium">Pending Leave Requests</div>
                        <div class="text-2xl font-bold text-white mt-1">${n}</div>
                        <div class="text-amber-400 text-xs mt-2">Requires administrative review</div>
                    </div>
                </div>
            </div>
        `}catch(o){console.error("Error fetching Supabase report metrics:",o),e.innerHTML=`<p class="text-red-400 text-center py-6">Error loading report data: ${o.message}</p>`}}document.addEventListener("DOMContentLoaded",()=>{window.lucide&&lucide.createIcons(),setupAuthTabs(),setupEventListeners(),checkSession()}),window.startLiveStream=function(e,t){let s=document.getElementById("live-stream-modal"),a=document.getElementById("live-stream-title"),r=document.getElementById("jitsi-container");if(!s||!r){alert("Live class modal container not found in HTML!");return}let l=currentUser?.role==="teacher";a.textContent=`Live Class: ${t} (${e}) — ${l?"Broadcasting (Host)":"Viewer Mode"}`,s.classList.remove("hidden"),r.innerHTML="";let n=`SmartEdu_Class_${e.replace(/[^a-zA-Z0-9]/g,"")}`,o={roomName:n,width:"100%",height:"100%",parentNode:r,userInfo:{displayName:`${currentUser?.name||"User"} (${l?"Teacher / Host":"Student"})`},configOverwrite:{prejoinPageEnabled:!1,prejoinConfig:{enabled:!1},startWithAudioMuted:!l,startWithVideoMuted:!l,disableDeepLinking:!0,mobileAppPromotionsEnabled:!1,disableAudioLevels:!l,desktopSharingFrameRate:{min:20,max:30},filmStripOnly:!1,disableSelfView:!l},interfaceConfigOverwrite:{SHOW_JITSI_WATERMARK:!1,SHOW_WATERMARK_FOR_GUESTS:!1,MOBILE_APP_PROMO:!1,TOOLBAR_BUTTONS:l?["microphone","camera","desktop","fullscreen","hangup","chat","raisehand","participants-pane"]:["microphone","fullscreen","hangup","chat","raisehand"],VERTICAL_FILMSTRIP:!1,HIDE_KICK_BACKGROUND_MEDIA:!0,OPTIMIZE_FOR_MOBILE:!0,DISABLE_FOCUS_INDICATOR:!0}};"undefined"!=typeof JitsiMeetExternalAPI?((jitsiApi=new JitsiMeetExternalAPI("meet.element.io",o)).addEventListener("videoConferenceLeft",()=>{window.closeLiveStream()}),jitsiApi.addEventListener("videoConferenceJoined",()=>{jitsiApi.executeCommand("setTileView",!1)}),jitsiApi.addEventListener("largeVideoChanged",()=>{jitsiApi.executeCommand("setTileView",!1)})):alert("Jitsi API script not loaded. Check index.html head.")},window.closeLiveStream=function(){if(void 0!==jitsiApi&&jitsiApi){try{jitsiApi.dispose()}catch(e){console.warn("Jitsi cleanup warning:",e)}jitsiApi=null}let t=document.getElementById("jitsi-container");t&&(t.innerHTML="");let s=document.getElementById("live-stream-modal");s&&s.classList.add("hidden")},window.approveUser=async function(e){let{error:t}=await supabaseClient.from("profiles").update({account_status:"active"}).eq("email",e);if(t){alert("Approval failed: "+t.message);return}renderOwnerDashboard(),alert("Account approved successfully! The user can now access their portal.")},window.openCreateExamModal=function(e){let t=document.getElementById("exam-modal"),s=document.getElementById("exam-modal-title"),a=document.getElementById("exam-modal-subtitle"),r=document.getElementById("exam-modal-body"),l=document.getElementById("exam-modal-footer");t&&(s.innerText="Create & Publish Class Exam",a.innerText=`Class Code: ${e}`,r.innerHTML=`
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
                <textarea id="exam-questions" rows="6" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono" placeholder="1. What is the capital of Rwanda? {Kigali}&#10;2. Water boils at [100\xb0C* | 50\xb0C | 0\xb0C]."></textarea>
            </div>
        </form>
    `,l.innerHTML=`
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">Cancel</button>
        <button onclick="window.saveExam('${e}')" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg">Publish Exam</button>
    `,t.classList.remove("hidden"))},window.saveExam=async function(e){let t=document.getElementById("exam-title")?.value.trim(),s=parseInt(document.getElementById("exam-duration")?.value||"30"),a=parseInt(document.getElementById("exam-total-marks")?.value||"100"),r=document.getElementById("exam-questions")?.value.trim();if(!t||!r){alert("Please fill in both the Exam Title and Questions!");return}if(!currentUser||!currentUser.email){alert("User session error. Please re-login.");return}let{error:l}=await supabaseClient.from("exams").insert([{class_code:e,teacher_email:currentUser.email,title:t,duration_minutes:s,total_marks:a,questions:r}]);l?alert("Error publishing exam: "+l.message):(alert("Exam published successfully!"),window.closeExamModal(),renderTeacherDashboard())},window.closeExamModal=function(){let e=document.getElementById("exam-modal");e&&e.classList.add("hidden")},window.openStudentExam=async function(e){let{data:t,error:s}=await supabaseClient.from("exams").select("*").eq("id",e).single();if(s||!t){alert("Could not load exam details.");return}let a=document.getElementById("exam-modal"),r=document.getElementById("exam-modal-title"),l=document.getElementById("exam-modal-subtitle"),n=document.getElementById("exam-modal-body"),o=document.getElementById("exam-modal-footer");if(!a)return;r.innerText=t.title,l.innerText=`Duration: ${t.duration_minutes} Mins | Total Marks: ${t.total_marks}`;let i=t.questions.split("\n").filter(e=>""!==e.trim()),d='<form id="student-exam-form" class="space-y-4">';i.forEach((e,t)=>{if(d+='<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">',e.includes("[")&&e.includes("]")){let s=e.split("[")[0].trim(),a=e.substring(e.indexOf("[")+1,e.indexOf("]")).split("|");d+=`<p class="text-xs font-bold text-white">${s}</p><div class="space-y-1 mt-2">`,a.forEach(e=>{let s=e.replace("*","").trim();d+=`
                    <label class="flex items-center gap-2 text-xs text-slate-300 p-2 bg-slate-900 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-800">
                        <input type="radio" name="q_${t}" value="${s}" class="text-indigo-600">
                        ${s}
                    </label>
                `}),d+="</div>"}else if(e.includes("{")&&e.includes("}")){let r=e.replace(/\{([^}]+)\}/g,"_____");d+=`
                <p class="text-xs font-bold text-white">${r}</p>
                <input type="text" name="q_${t}" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-2" placeholder="Type your answer here...">
            `}else d+=`<p class="text-xs font-bold text-white">${e}</p>`;d+="</div>"}),d+="</form>",n.innerHTML=d,o.innerHTML=`
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
        <button onclick="window.submitStudentExam(${t.id})" class="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg">Submit Answers</button>
    `,a.classList.remove("hidden")},window.submitStudentExam=async function(e){let t=document.getElementById("student-exam-form");if(!t)return;let{data:s,error:a}=await supabaseClient.from("exams").select("*").eq("id",e).single();if(a||!s){alert("Failed to evaluate exam. Please try again.");return}let r=s.questions.split("\n").filter(e=>""!==e.trim()),l=r.length,n=0,o={};r.forEach((e,s)=>{let a="",r="";if(e.includes("[")&&e.includes("]")){let l=e.substring(e.indexOf("[")+1,e.indexOf("]")).split("|"),i=l.find(e=>e.includes("*"));i&&(a=i.replace("*","").trim().toLowerCase());let d=t.querySelector(`input[name="q_${s}"]:checked`);d&&(r=d.value.trim().toLowerCase())}else if(e.includes("{")&&e.includes("}")){let c=e.match(/\{([^}]+)\}/);c&&(a=c[1].trim().toLowerCase());let m=t.querySelector(`input[name="q_${s}"]`);m&&(r=m.value.trim().toLowerCase())}o[`q_${s}`]=r,r&&a&&r===a&&n++});let i=s.total_marks/(l||1),d=Math.round(n*i),c=Math.round(d/s.total_marks*100),m=currentUser?.email||"student@smartedu.rw",p=currentUser?.name||currentUser?.full_name||"Student",{error:u}=await supabaseClient.from("submissions").insert([{exam_id:e,student_email:m,student_name:p,score_obtained:d,percentage:c,answers:JSON.stringify(o)}]);u?alert("Error submitting exam: "+u.message):(window.renderMarkingGuideInModal(s,o,d,c),renderStudentDashboard())},window.renderMarkingGuideInModal=function(e,t,s,a){let r=document.getElementById("exam-modal-title"),l=document.getElementById("exam-modal-subtitle"),n=document.getElementById("exam-modal-body"),o=document.getElementById("exam-modal-footer");if(!r||!n)return;let i=a>=50;r.innerText=`Marking Guide: ${e.title}`,l.innerText=`Score: ${s} / ${e.total_marks} (${a}%) - ${i?"PASSED \uD83C\uDF89":"NEEDS IMPROVEMENT ⚠️"}`;let d=e.questions.split("\n").filter(e=>""!==e.trim()),c=`
        <div class="space-y-4">
            <div class="p-4 rounded-xl text-center font-bold ${i?"bg-emerald-950/60 text-emerald-300 border border-emerald-800":"bg-rose-950/60 text-rose-300 border border-rose-800"}">
                <p class="text-sm">Exam Submitted Successfully!</p>
                <p class="text-xs font-normal mt-1 text-slate-300">Below is the question-by-question breakdown and correct answers.</p>
            </div>
    `;d.forEach((e,s)=>{let a="",r="",l=[],n=t[`q_${s}`]||"No Answer";if(e.includes("[")&&e.includes("]")){a=e.split("[")[0].trim(),l=e.substring(e.indexOf("[")+1,e.indexOf("]")).split("|");let o=l.find(e=>e.includes("*"));o&&(r=o.replace("*","").trim())}else if(e.includes("{")&&e.includes("}")){a=e.replace(/\{([^}]+)\}/g,"_____");let i=e.match(/\{([^}]+)\}/);i&&(r=i[1].trim())}else a=e;let d=String(n).trim().toLowerCase()===String(r).trim().toLowerCase();c+=`
            <div class="bg-slate-950 p-4 rounded-xl border ${d?"border-emerald-800/60":"border-rose-800/60"} space-y-2">
                <div class="flex justify-between items-start gap-2">
                    <p class="text-xs font-bold text-white">Q${s+1}: ${a}</p>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${d?"bg-emerald-950 text-emerald-300 border border-emerald-800":"bg-rose-950 text-rose-300 border border-rose-800"}">
                        ${d?"✓ Correct":"✗ Incorrect"}
                    </span>
                </div>

                ${l.length>0?`
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                        ${l.map(e=>{let t=e.replace("*","").trim(),s=t.toLowerCase()===n.toLowerCase(),a=t.toLowerCase()===r.toLowerCase(),l="bg-slate-900 border-slate-800 text-slate-400";return a?l="bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold":s&&!a&&(l="bg-rose-950/70 border-rose-600 text-rose-200 font-bold"),`
                                <div class="p-2 rounded-lg border text-[11px] ${l}">
                                    ${t} ${a?"✓ (Correct)":s?"✗ (Your Answer)":""}
                                </div>
                            `}).join("")}
                    </div>
                `:`
                    <div class="text-xs space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-2">
                        <p><span class="text-slate-400">Your Answer:</span> <strong class="${d?"text-emerald-400":"text-rose-400"}">${n}</strong></p>
                        <p><span class="text-slate-400">Correct Answer:</span> <strong class="text-emerald-400">${r}</strong></p>
                    </div>
                `}
            </div>
        `}),c+="</div>",n.innerHTML=c,o.innerHTML=`
        <button onclick="window.closeExamModal()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg">Done Reviewing</button>
    `},window.viewStudentMarkingGuide=async function(e){let{data:t,error:s}=await supabaseClient.from("exams").select("*").eq("id",e).single(),{data:a,error:r}=await supabaseClient.from("submissions").select("*").eq("exam_id",e).eq("student_email",currentUser?.email).single();if(s||r||!t||!a){alert("Could not retrieve marking guide.");return}let l={};try{l="string"==typeof a.answers?JSON.parse(a.answers):a.answers||{}}catch(n){l={}}let o=document.getElementById("exam-modal");o&&o.classList.remove("hidden"),window.renderMarkingGuideInModal(t,l,a.score_obtained,a.percentage)},window.viewExamResults=async function(e){let t=document.getElementById("exam-modal"),s=document.getElementById("exam-modal-title"),a=document.getElementById("exam-modal-subtitle"),r=document.getElementById("exam-modal-body"),l=document.getElementById("exam-modal-footer");if(!t)return;let{data:n,error:o}=await supabaseClient.from("exams").select("*").eq("id",e).single();if(o||!n){alert("Could not load exam details.");return}let{data:i,error:d}=await supabaseClient.from("submissions").select("*").eq("exam_id",e).order("score_obtained",{ascending:!1});s.innerText=`Exam Results: ${n.title}`,a.innerText=`Total Marks: ${n.total_marks} | Total Submissions: ${i?i.length:0}`,d||!i||0===i.length?r.innerHTML=`
            <div class="text-center py-8 space-y-2">
                <p class="text-slate-400 text-sm font-semibold">No submissions received yet.</p>
                <p class="text-slate-500 text-xs">Student scores will appear here automatically once they complete the exam.</p>
            </div>
        `:r.innerHTML=`
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
                        ${i.map(e=>`
                            <tr class="hover:bg-slate-950/50 transition">
                                <td class="py-3 px-3 font-bold text-white">${e.student_name||"Student"}</td>
                                <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">${e.student_email}</td>
                                <td class="py-3 px-3 text-center font-mono font-bold text-indigo-300">${e.score_obtained} /${n.total_marks}</td>
                                <td class="py-3 px-3 text-center">
                                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${e.percentage>=50?"bg-emerald-950 text-emerald-300 border border-emerald-800":"bg-rose-950 text-rose-300 border border-rose-800"}">
                                        ${e.percentage}%
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `,l.innerHTML=`
        <button onclick="window.closeExamModal()" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">Close</button>
    `,t.classList.remove("hidden")},window.toggleHelpModal=function(e){let t=document.getElementById("help-desk-modal");if(t){if(e){t.classList.remove("hidden");let s=JSON.parse(localStorage.getItem("currentUser")||localStorage.getItem("user")||"{}"),a=document.getElementById("help-user-name"),r=document.getElementById("help-user-email"),l=document.getElementById("help-user-phone");a&&!a.value&&(a.value=s.name||s.full_name||""),r&&!r.value&&(r.value=s.email||""),l&&!l.value&&(l.value=s.phone||s.phone_number||"")}else t.classList.add("hidden")}},window.switchHelpTab=function(e){let t=document.getElementById("help-desk-form"),s=document.getElementById("help-history-view"),a=document.getElementById("tab-btn-new"),r=document.getElementById("tab-btn-history");"new"===e?(t&&t.classList.remove("hidden"),s&&s.classList.add("hidden"),a&&(a.className="pb-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold"),r&&(r.className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold")):(t&&t.classList.add("hidden"),s&&s.classList.remove("hidden"),r&&(r.className="pb-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold"),a&&(a.className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold"),"function"==typeof window.loadMyTickets&&window.loadMyTickets())},window.loadUserDirectory=async function(){let e=document.getElementById("user-directory-tbody");if(e)try{let{data:t,error:s}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:!1});if(s)throw s;if(!t||0===t.length){e.innerHTML='<tr><td colspan="4" class="py-6 text-center text-slate-500">No registered users found.</td></tr>';return}e.innerHTML=t.map(e=>{let t="bg-slate-800 text-slate-300";"teacher"===e.role&&(t="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"),"student"===e.role&&(t="bg-blue-500/20 text-blue-300 border border-blue-500/30"),("admin"===e.role||"owner"===e.role)&&(t="bg-purple-500/20 text-purple-300 border border-purple-500/30");let s=e.name||e.full_name||e.username||e.display_name||(e.email?e.email.split("@")[0]:"Registered User"),a=e.phone||e.phone_number||e.mobile||"";return`
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                    <td class="py-3 px-4">
                        <div class="font-bold text-white text-xs">${s}</div>
                        ${a?`<div class="text-[10px] text-slate-400 font-mono">📞 ${a}</div>`:""}
                    </td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${t}">${e.role||"Member"}</span></td>
                    <td class="py-3 px-4 font-mono text-slate-300 text-xs">${e.email||"N/A"}</td>
                    <td class="py-3 px-4 text-emerald-400 font-medium text-xs">● Active</td>
                </tr>
            `}).join("")}catch(a){console.warn("Error loading user directory:",a)}},document.addEventListener("DOMContentLoaded",()=>{let e=document.getElementById("help-desk-form");e&&e.addEventListener("submit",async e=>{e.preventDefault();let t=document.getElementById("help-category")?.value||"General Inquiry",s=document.getElementById("help-message")?.value||"";if(!s.trim()){alert("Please enter a message before submitting.");return}let a=document.getElementById("help-user-name")?.value?.trim()||"",r=document.getElementById("help-user-email")?.value?.trim()||"",l=document.getElementById("help-user-phone")?.value?.trim()||"",n=null,o=JSON.parse(localStorage.getItem("currentUser")||localStorage.getItem("user")||"{}");o&&(n=o.id||o.user_id||null,a||(a=o.name||o.full_name||""),r||(r=o.email||""),l||(l=o.phone||o.phone_number||o.phone_No||""));try{if(void 0!==supabaseClient&&supabaseClient.auth){let{data:i}=await supabaseClient.auth.getUser();i?.user&&(n=i.user.id||n,r||(r=i.user.email||""))}}catch(d){console.warn("Auth session check warning:",d)}if(n||r)try{let c=supabaseClient.from("profiles").select("*");if(c=n&&isValidUUID(n)?c.eq("id",n):r?c.eq("email",r):null){let{data:m}=await c.maybeSingle();m&&(n=m.id||n,a||(a=m.name||m.full_name||""),r||(r=m.email||""),l||(l=m.phone||m.phone_number||""))}}catch(p){console.warn("Profiles query warning:",p)}if(a=a||(r?r.split("@")[0]:"Registered User"),l=l||"N/A","N/A"!==(r=r||"N/A"))try{let u=JSON.parse(localStorage.getItem("currentUser")||"{}");u.email=r,a&&(u.name=a),l&&(u.phone=l),localStorage.setItem("currentUser",JSON.stringify(u))}catch($){console.warn("Could not persist submission session email:",$)}let x=isValidUUID(n)?String(n):null;try{let{error:b}=await supabaseClient.from("help_tickets").insert([{user_id:x,user_name:a,user_email:r,phone_number:l,category:t,message:s.trim(),status:"Pending"}]);if(b)throw b;alert("✅ Complaint/Suggestion successfully sent!");let g=document.getElementById("help-message");g&&(g.value=""),"function"==typeof toggleHelpModal&&toggleHelpModal(!1),"function"==typeof window.loadHelpTickets&&window.loadHelpTickets(),"function"==typeof window.loadMyTickets&&window.loadMyTickets()}catch(f){console.error("Submission error:",f),alert("Error submitting ticket: "+(f.message||"Database error"))}}),document.getElementById("help-tickets-tbody")&&"function"==typeof window.loadHelpTickets&&window.loadHelpTickets(),document.getElementById("my-tickets-container")&&"function"==typeof window.loadMyTickets&&window.loadMyTickets(),document.getElementById("user-directory-tbody")&&"function"==typeof window.loadUserDirectory&&window.loadUserDirectory()}),window.loadMyTickets=async function(){let e=document.getElementById("my-tickets-container");if(!e)return;let t=null;if("undefined"!=typeof currentUserProfile&&currentUserProfile?.email&&(t=currentUserProfile.email),!t&&void 0!==supabaseClient&&supabaseClient.auth)try{let{data:s}=await supabaseClient.auth.getUser();s?.user&&(t=s.user.email)}catch(a){console.warn("Could not fetch auth user email:",a)}if(!t){let r=JSON.parse(localStorage.getItem("currentUser")||localStorage.getItem("user")||"{}");r.email&&(t=r.email)}if(!t){let l=document.getElementById("help-user-email");l&&l.value.trim()&&(t=l.value.trim())}if(!t&&(t=prompt("Enter the email address you used when submitting your ticket:"))&&t.trim()){t=t.trim();let n=document.getElementById("help-user-email");n&&(n.value=t);try{localStorage.setItem("currentUser",JSON.stringify({email:t}))}catch(o){}}if(!t){e.innerHTML=`
            <div class="text-center py-6 space-y-2">
                <p class="text-xs text-rose-400 font-semibold">Email required to view submitted tickets.</p>
                <p class="text-[11px] text-slate-400">Please enter your email address in the form tab or log in.</p>
                <button onclick="switchHelpTab('new')" class="mt-2 text-[11px] bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded hover:bg-indigo-600/50">Go to Form</button>
            </div>
        `;return}try{e.innerHTML=`<p class="text-xs text-indigo-400 text-center py-4">Checking tickets for <span class="font-mono">${t}</span>...</p>`;let{data:i,error:d}=await supabaseClient.from("help_tickets").select("*").ilike("user_email",t.trim()).order("created_at",{ascending:!1});if(d)throw d;if(!i||0===i.length){e.innerHTML=`
                <div class="text-center py-6 space-y-2">
                    <p class="text-xs text-slate-400">No tickets found for <span class="text-indigo-300 font-mono">${t}</span>.</p>
                    <button onclick="switchHelpTab('new')" class="text-[11px] text-indigo-400 underline hover:text-indigo-300">Submit a ticket</button>
                </div>
            `;return}e.innerHTML=`
            <div class="mb-3 text-[11px] text-slate-400 flex justify-between items-center px-1 border-b border-slate-800 pb-2">
                <span>Showing tickets for: <strong class="text-indigo-300 font-mono">${t}</strong></span>
                <button onclick="localStorage.removeItem('currentUser'); window.loadMyTickets();" class="text-slate-500 hover:text-slate-300 underline text-[10px]">Use Different Email</button>
            </div>
        `+i.map(e=>{let t=new Date(e.created_at).toLocaleDateString()+" "+new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),s="Resolved"===e.status;return`
                <div class="bg-slate-950 border ${s?"border-emerald-800/40":"border-slate-800"} rounded-xl p-4 text-xs space-y-2 text-left mb-3 shadow-md">
                    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span class="font-bold text-indigo-300">${e.category||"General Inquiry"}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] ${s?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-amber-500/20 text-amber-300 border-amber-500/30"} px-2 py-0.5 rounded border uppercase font-bold text-[9px]">${e.status||"Pending"}</span>
                            <span class="text-[10px] text-slate-500 font-mono">${t}</span>
                        </div>
                    </div>
                    
                    <p class="text-slate-200 mt-1"><span class="text-slate-400 font-semibold">Your Message:</span> ${e.message}</p>
                    
                    ${e.admin_response?`
                        <div class="mt-3 bg-indigo-950/50 border border-indigo-700/60 p-3 rounded-lg text-indigo-100 space-y-1">
                            <p class="font-extrabold text-[11px] text-indigo-300 flex items-center gap-1">
                                🛡️ System Owner / Admin Reply:
                            </p>
                            <p class="text-slate-200 text-xs pl-1">${e.admin_response}</p>
                        </div>
                    `:`
                        <div class="text-[11px] text-amber-400/80 italic mt-2 flex items-center gap-1">
                            ⏳ Status: Pending response from system management...
                        </div>
                    `}
                </div>
            `}).join("")}catch(c){console.warn("Error fetching user tickets:",c),e.innerHTML=`<p class="text-xs text-rose-400 text-center py-4">Failed to load tickets: ${c.message||"Database error"}</p>`}},window.loadHelpTickets=async function(){let e=document.getElementById("help-tickets-tbody");if(e)try{let{data:t,error:s}=await supabaseClient.from("help_tickets").select("*").order("created_at",{ascending:!1});if(s)throw s;if(!t||0===t.length){e.innerHTML='<tr><td colspan="6" class="py-6 text-center text-slate-500">No suggestions or complaints submitted yet.</td></tr>';return}let{data:a}=await supabaseClient.from("profiles").select("*"),r={},l={};a&&a.forEach(e=>{e.id&&isValidUUID(e.id)&&(r[String(e.id)]=e),e.email&&(l[e.email.toLowerCase().trim()]=e)}),e.innerHTML=t.map(e=>{let t=new Date(e.created_at).toLocaleDateString()+" "+new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),s="Resolved"===e.status?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-amber-500/20 text-amber-300 border-amber-500/30",a=(e.user_email||"").toLowerCase().trim(),n=(e.user_id?r[String(e.user_id)]:null)||l[a],o=e.user_name&&!["Registered User","User","Anonymous User","Anonymous","Guest User","N/A"].includes(e.user_name.trim())?e.user_name:null;!o&&n&&(o=n.name||n.full_name||n.username),o||!e.user_email||["N/A","No Email"].includes(e.user_email)||(o=e.user_email.split("@")[0]),o||(o="Registered User");let i=e.user_email&&!["N/A","No Email"].includes(e.user_email)?e.user_email:n?.email||"No Email",d=e.phone_number&&!["N/A","No Phone"].includes(e.phone_number)?e.phone_number:n?.phone||n?.phone_number||"No Phone";return`
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                    <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">${t}</td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-white text-xs">${o}</div>
                        <div class="text-indigo-300 text-[11px] font-mono">${i}</div>
                        <div class="text-slate-400 text-[10px] font-mono">📞 ${d}</div>
                    </td>
                    <td class="py-3 px-4 font-semibold text-indigo-300">${e.category}</td>
                    <td class="py-3 px-4 text-slate-200 max-w-xs break-words">${e.message}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${s}">${e.status||"Pending"}</span>
                        ${e.admin_response?`<div class="text-[10px] text-slate-400 mt-1.5 max-w-xs italic border-l-2 border-indigo-500 pl-1.5">💬 ${e.admin_response}</div>`:""}
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="replyToTicket('${e.id}')" class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors block">
                            💬 Reply
                        </button>
                    </td>
                </tr>
            `}).join("")}catch(n){console.warn("Error loading inbox tickets:",n),e.innerHTML='<tr><td colspan="6" class="py-4 text-center text-rose-400">Failed to load inbox.</td></tr>'}},window.replyToTicket=async function(e){let t=prompt("Enter your reply message:");if(t&&t.trim())try{let{error:s}=await supabaseClient.from("help_tickets").update({admin_response:t.trim(),status:"Resolved"}).eq("id",e);if(s)throw s;alert("✅ Reply submitted successfully!"),"function"==typeof window.loadHelpTickets?window.loadHelpTickets():location.reload()}catch(a){console.error("Error sending reply:",a),alert("Failed to send reply: "+(a.message||"Database error"))}},window.loadStudentsForReport=loadStudentsForReport,window.handleGenerateReport=handleGenerateReport,window.generateReportCard=generateReportCard,!0!==window.hasInitializedDashboard&&(window.hasInitializedDashboard=!0,document.addEventListener("DOMContentLoaded",()=>{let e=Session.getUser()||JSON.parse(localStorage.getItem("currentUser")||"{}");console.log("Master Dispatcher Triggered. Active User:",e);let t=e.role;if("head-teacher"===t){let s=document.getElementById("head-teacher-dashboard");s&&s.classList.remove("hidden"),renderHeadTeacherDashboard()}else if("teacher"===t){let a=document.getElementById("teacher-dashboard");a&&a.classList.remove("hidden"),renderTeacherDashboard()}else if("student"===t){let r=document.getElementById("student-dashboard");r&&r.classList.remove("hidden"),renderStudentDashboard()}else if("owner"===t){let l=document.getElementById("owner-dashboard");l&&l.classList.remove("hidden"),renderOwnerDashboard()}}));
