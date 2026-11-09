let supabaseClient;
let accessToken = null;
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';

const $ = (id) => document.getElementById(id);
const logoutButton = $('logoutButton');
const refreshButton = $('refreshButton');
const checkinForm = $('checkinForm');
const checkinButton = $('checkinButton');
const checkinMessage = $('checkinMessage');
const seekerResult = $('seekerResult');
const searchForm = $('searchForm');
const participantRows = $('participantRows');

async function initializeDashboard() {
    try {
        const configResponse = await fetch('/api/config/supabase');
        if (!configResponse.ok) throw new Error('Unable to load login configuration.');
        const config = await configResponse.json();
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) {
            window.location.replace('/staff-login.html');
            return;
        }
        accessToken = session.access_token;

        const response = await apiRequest('/api/staff/me');
        const result = await response.json();
        if (!response.ok || !result.success || result.staff.role !== 'volunteer') {
            await supabaseClient.auth.signOut();
            window.location.replace('/staff-login.html');
            return;
        }

        $('staffName').textContent = result.staff.full_name || 'Volunteer';
        $('staffDepartment').textContent = result.staff.department || 'Volunteer';
        await loadParticipants();
        await loadCheckedInParticipants();
    } catch (error) {
        $('directoryMessage').textContent = error.message || 'Unable to load the volunteer dashboard.';
        if (!accessToken) window.location.replace('/staff-login.html');
    }
}

async function apiRequest(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken}`
        }
    });
}

async function loadCheckedInParticipants() {
    const rows = $('checkedInRows');
    const message = $('checkedInMessage');
    message.textContent = 'Loading checked-in seekers...';

    try {
        const response = await apiRequest('/api/staff/records/checked-in?page=1&limit=100');
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Unable to load checked-in seekers.');
        }

        const people = result.participants || [];
        if (people.length === 0) {
            rows.innerHTML = '<tr><td colspan="5" class="empty">No seekers have checked in yet.</td></tr>';
            message.textContent = 'No check-in records found.';
            return;
        }

        rows.replaceChildren(...people.map(person => {
            const tr = document.createElement('tr');
            const values = [
                person.registration_number,
                person.full_name,
                person.tshirt_size || '—'
            ];

            values.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value || '—';
                tr.appendChild(td);
            });

            const paymentCell = document.createElement('td');
            const status = document.createElement('span');
            status.className = 'status ' + (person.payment_status === 'paid' ? 'paid' : 'pending');
            status.textContent = person.payment_status || 'Unknown';
            paymentCell.appendChild(status);
            tr.appendChild(paymentCell);

            const timeCell = document.createElement('td');
            timeCell.textContent = person.ticket_used_at
                ? new Date(person.ticket_used_at).toLocaleString()
                : 'Time unavailable';
            tr.appendChild(timeCell);

            return tr;
        }));

        message.textContent = `${result.total || people.length} seeker(s) checked in.`;
    } catch (error) {
        rows.innerHTML = '<tr><td colspan="5" class="empty">Could not load checked-in seekers.</td></tr>';
        message.textContent = error.message;
        message.className = 'message error';
    }
}

let qrScanner = null;
let scannerRunning = false;
let qrCheckinBusy = false;

function setScannerMessage(message, type = '') {
    const element = $('scannerMessage');
    element.textContent = message;
    element.className = `message ${type}`.trim();
}

async function verifyScannedTicket(ticketToken) {
    if (qrCheckinBusy) return;
    qrCheckinBusy = true;
    const startButton = $('startScannerButton');
    startButton.disabled = true;
    setScannerMessage('Verifying ticket...', '');

    try {
        const response = await apiRequest('/api/staff/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketToken })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            if (result.seeker) showSeekerResult(result.seeker);
            throw new Error(result.message || 'Ticket verification failed.');
        }

        showSeekerResult(result.seeker);
        setScannerMessage(result.message || 'Ticket verified. Seeker checked in successfully.', 'success');
        await loadParticipants();
        await loadCheckedInParticipants();
    } catch (error) {
        setScannerMessage(error.message || 'Unable to verify this QR ticket.', 'error');
    } finally {
        qrCheckinBusy = false;
        startButton.disabled = false;
    }
}

async function startQRScanner() {
    if (scannerRunning || qrCheckinBusy) return;

    try {
        if (!window.Html5Qrcode) {
            throw new Error('QR scanner library could not be loaded. Refresh the page and try again.');
        }

        const startButton = $('startScannerButton');
        const stopButton = $('stopScannerButton');
        startButton.disabled = true;
        setScannerMessage('Starting camera...');

        qrScanner = new Html5Qrcode('qrReader');
        await qrScanner.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            async decodedText => {
                if (qrCheckinBusy) return;
                await stopQRScanner();
                await verifyScannedTicket(decodedText);
            },
            () => {
                // Ignore individual frames where no QR code is detected.
            }
        );

        scannerRunning = true;
        stopButton.disabled = false;
        setScannerMessage("Camera ready. Point it at a seeker's QR ticket.", 'success');
    } catch (error) {
        console.error('Volunteer QR scanner error:', error);
        setScannerMessage(
            error.message || 'Could not start the camera. Allow camera access and use the secure website (HTTPS).',
            'error'
        );
        if (qrScanner) {
            try { await qrScanner.clear(); } catch {}
            qrScanner = null;
        }
        scannerRunning = false;
        $('startScannerButton').disabled = false;
        $('stopScannerButton').disabled = true;
    }
}

async function stopQRScanner() {
    const startButton = $('startScannerButton');
    const stopButton = $('stopScannerButton');

    if (!qrScanner) {
        scannerRunning = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        return;
    }

    try {
        if (scannerRunning) await qrScanner.stop();
        await qrScanner.clear();
    } catch (error) {
        console.error('Volunteer QR scanner stop error:', error);
    } finally {
        qrScanner = null;
        scannerRunning = false;
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

async function loadParticipants() {
    $('directoryMessage').textContent = 'Loading records...';
    try {
        const params = new URLSearchParams({ page: String(currentPage), limit: '25' });
        if (currentSearch) params.set('search', currentSearch);
        const response = await apiRequest(`/api/staff/records?${params.toString()}`);
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load seeker records.');

        $('paidCount').textContent = result.stats.paid ?? 0;
        $('pendingCount').textContent = result.stats.pending ?? 0;
        $('checkedInCount').textContent = result.stats.checkedIn ?? 0;
        totalPages = Math.max(1, result.totalPages || 1);
        $('pageInfo').textContent = `Page ${currentPage} of ${totalPages} · ${result.total || 0} seekers`;
        $('previousPage').disabled = currentPage <= 1;
        $('nextPage').disabled = currentPage >= totalPages;

        if (!result.participants || result.participants.length === 0) {
            participantRows.innerHTML = '<tr><td colspan="5" class="empty">No seeker records found.</td></tr>';
        } else {
            participantRows.replaceChildren(...result.participants.map(person => {
                const tr = document.createElement('tr');
                const values = [
                    person.registration_number,
                    person.full_name,
                    person.age == null ? '—' : person.age,
                    person.tshirt_size || '—'
                ];
                values.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
                const payment = document.createElement('td');
                const status = document.createElement('span');
                status.className = 'status ' + (person.payment_status === 'paid' ? 'paid' : 'pending');
                status.textContent = person.payment_status || 'Unknown';
                payment.appendChild(status);
                tr.appendChild(payment);
                return tr;
            }));
        }
        $('directoryMessage').textContent = '';
    } catch (error) {
        $('directoryMessage').textContent = error.message;
        participantRows.innerHTML = '<tr><td colspan="5" class="empty">Could not load records.</td></tr>';
    }
}

$('startScannerButton').addEventListener('click', startQRScanner);
$('stopScannerButton').addEventListener('click', stopQRScanner);

window.addEventListener('pagehide', () => {
    if (qrScanner && scannerRunning) {
        qrScanner.stop().catch(() => {});
    }
});

checkinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const registrationNumber = $('registrationNumber').value.trim().toUpperCase();
    if (!registrationNumber) return;
    checkinButton.disabled = true;
    checkinButton.textContent = 'Checking...';
    checkinMessage.textContent = '';
    seekerResult.hidden = true;
    try {
        const response = await apiRequest('/api/staff/checkin/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationNumber })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            if (result.seeker) showSeekerResult(result.seeker);
            throw new Error(result.message || 'Check-in failed.');
        }
        showSeekerResult(result.seeker);
        checkinMessage.textContent = result.message || 'Check-in successful.';
        checkinMessage.className = 'message success';
        $('registrationNumber').value = '';
        await loadParticipants();
        await loadCheckedInParticipants();
    } catch (error) {
        checkinMessage.textContent = error.message;
        checkinMessage.className = 'message error';
    } finally {
        checkinButton.disabled = false;
        checkinButton.textContent = 'Check In Seeker';
    }
});

function showSeekerResult(person) {
    seekerResult.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = person.fullName || 'Seeker';
    const details = document.createElement('span');
    details.textContent = `${person.registrationNumber || ''} · ${person.checkedIn ? 'Checked in' : 'Not checked in'}`;
    seekerResult.append(heading, details);
    seekerResult.hidden = false;
}

searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    currentSearch = $('searchInput').value.trim();
    currentPage = 1;
    await loadParticipants();
});

$('previousPage').addEventListener('click', async () => {
    if (currentPage > 1) { currentPage--; await loadParticipants(); }
});
$('nextPage').addEventListener('click', async () => {
    if (currentPage < totalPages) { currentPage++; await loadParticipants(); }
});
refreshButton.addEventListener('click', async () => {
    await loadParticipants();
    await loadCheckedInParticipants();
});
$('refreshCheckedInButton').addEventListener('click', loadCheckedInParticipants);

logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.replace('/staff-login.html');
});

initializeDashboard();