document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY_GUESTS = "edufair_2026_guests";
    const STORAGE_KEY_RSVP = "edufair_2026_rsvp";

    // ==========================================
    // 0. TOGGLE NAVBAR MOBILE
    // ==========================================
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });

        navMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
            });
        });
    }

    // ==========================================
    // 1. LOGIKA HALAMAN UNDANGAN (index.html)
    // ==========================================
    const guestNameEl = document.getElementById("guest-name");
    const guestCategoryEl = document.getElementById("guest-category");
    const rsvpInstansiInput = document.getElementById("rsvp-instansi");
    const rsvpForm = document.getElementById("rsvp-form");

    if (guestNameEl && guestCategoryEl) {
        const urlParams = new URLSearchParams(window.location.search);
        const toParam = urlParams.get("to");
        const kategoriParam = urlParams.get("kategori");

        if (toParam) {
            guestNameEl.textContent = toParam;
            if (rsvpInstansiInput) {
                rsvpInstansiInput.value = toParam;
            }
        }

        if (kategoriParam) {
            guestCategoryEl.textContent = `Kategori: ${kategoriParam}`;
        }
    }

    if (rsvpForm) {
        rsvpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const instansi = document.getElementById("rsvp-instansi").value.trim();
            const pic = document.getElementById("rsvp-pic").value.trim();
            const status = document.getElementById("rsvp-status").value;
            const jumlah = document.getElementById("rsvp-jumlah").value;

            // Simpan data RSVP ke localStorage
            const existingRsvp = JSON.parse(localStorage.getItem(STORAGE_KEY_RSVP) || "[]");
            existingRsvp.push({
                instansi,
                pic,
                status,
                jumlah,
                waktu: new Date().toLocaleString("id-ID")
            });
            localStorage.setItem(STORAGE_KEY_RSVP, JSON.stringify(existingRsvp));

            const feedbackEl = document.getElementById("rsvp-feedback");
            feedbackEl.innerHTML = `Terima kasih, <strong>${pic}</strong> (${instansi}). Konfirmasi status <strong>"${status}"</strong> untuk ${jumlah} orang telah tersimpan.`;
            feedbackEl.classList.remove("hidden");
            rsvpForm.reset();
        });
    }

    // ==========================================
    // 2. LOGIKA HALAMAN ADMIN BLAST (admin.html)
    // ==========================================
    const csvInput = document.getElementById("csv-file-input");
    const baseUrlInput = document.getElementById("base-url-input");
    const tableBody = document.getElementById("guest-table-body");
    const totalGuestsBadge = document.getElementById("total-guests");
    const btnClearCsv = document.getElementById("btn-clear-csv");
    const rsvpTableBody = document.getElementById("rsvp-table-body");
    const totalRsvpBadge = document.getElementById("total-rsvp");

    if (csvInput && baseUrlInput) {
        const currentUrl = window.location.href;
        const defaultTargetUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/") + 1) + "index.html";
        baseUrlInput.value = defaultTargetUrl;

        // Muat data tamu yang tersimpan dari localStorage saat halaman dibuka
        let parsedGuests = JSON.parse(localStorage.getItem(STORAGE_KEY_GUESTS) || "[]");
        if (parsedGuests.length > 0) {
            renderGuestTable(parsedGuests);
        }

        // Muat rekap RSVP dari localStorage
        renderRsvpTable();

        csvInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                parsedGuests = parseCSV(text);
                if (parsedGuests.length === 0) {
                    alert("File CSV kosong atau format header tidak sesuai!");
                    return;
                }
                // Simpan permanen ke localStorage
                localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(parsedGuests));
                renderGuestTable(parsedGuests);
            };
            reader.readAsText(file, "UTF-8");
        });

        baseUrlInput.addEventListener("input", () => {
            if (parsedGuests.length > 0) {
                renderGuestTable(parsedGuests);
            }
        });

        if (btnClearCsv) {
            btnClearCsv.addEventListener("click", () => {
                localStorage.removeItem(STORAGE_KEY_GUESTS);
                parsedGuests = [];
                csvInput.value = "";
                totalGuestsBadge.textContent = "0 Data Dimuat";
                tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Silakan unggah file <strong>data-tamu.csv</strong> untuk menampilkan daftar tamu.</td></tr>`;
            });
        }

        function parseCSVLine(line, delimiter) {
            const result = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        }

        function parseCSV(csvText) {
            const cleanText = csvText.replace(/^\uFEFF/, "").trim();
            const lines = cleanText.split(/\r?\n/);
            if (lines.length < 2) return [];

            const delimiter = lines[0].includes(";") ? ";" : ",";
            const headers = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase());
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = parseCSVLine(lines[i], delimiter);
                const rowObj = {};

                headers.forEach((header, index) => {
                    rowObj[header] = values[index] || "";
                });

                data.push(rowObj);
            }
            return data;
        }

        function renderGuestTable(guests) {
            tableBody.innerHTML = "";
            totalGuestsBadge.textContent = `${guests.length} Tamu Terdaftar`;

            const baseUrl = baseUrlInput.value.trim();

            guests.forEach((guest) => {
                const params = new URLSearchParams({
                    to: guest.instansi || "",
                    kategori: guest.kategori || ""
                });
                const personalizedLink = `${baseUrl}?${params.toString()}`;

                const waMessage =
`Yth. *${guest.nama_tamu}*
Perwakilan *${guest.instansi}*

Dengan hormat,
Kami mengundang Bapak/Ibu dalam acara *Edu Fair & Career Day 2026* yang akan diselenggarakan pada Sabtu, 14 November 2026.

Detail acara, fasilitas booth, serta form konfirmasi kehadiran (RSVP) dapat diakses melalui tautan undangan digital berikut:
${personalizedLink}

Atas perhatian dan partisipasinya, kami ucapkan terima kasih.
*Panitia Edu Fair & Career Day 2026*`;

                const waUrl = `https://wa.me/${guest.no_whatsapp}?text=${encodeURIComponent(waMessage)}`;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${guest.id || "-"}</td>
                    <td><strong>${guest.nama_tamu || "-"}</strong></td>
                    <td>${guest.instansi || "-"}</td>
                    <td><span class="category-pill">${guest.kategori || "-"}</span></td>
                    <td>${guest.no_whatsapp || "-"}</td>
                    <td><a href="${personalizedLink}" target="_blank">Buka Undangan</a></td>
                    <td>
                        <a href="${waUrl}" target="_blank" class="btn-wa">
                            Kirim Undangan WhatsApp
                        </a>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }

        function renderRsvpTable() {
            if (!rsvpTableBody) return;
            const rsvpList = JSON.parse(localStorage.getItem(STORAGE_KEY_RSVP) || "[]");
            totalRsvpBadge.textContent = `${rsvpList.length} Konfirmasi`;

            if (rsvpList.length === 0) return;

            rsvpTableBody.innerHTML = "";
            rsvpList.forEach((item, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td><strong>${item.instansi}</strong></td>
                    <td>${item.pic}</td>
                    <td><span class="category-pill">${item.status}</span></td>
                    <td>${item.jumlah} Orang</td>
                    <td>${item.waktu}</td>
                `;
                rsvpTableBody.appendChild(tr);
            });
        }
    }
});