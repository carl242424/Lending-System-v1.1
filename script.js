// Global variables
let loans = [];
let collections = [];
let currentUser = '';
let selectedLoanIndex = -1;
let filteredCollections = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadLoansFromStorage();
    loadCollectionsFromStorage();
    setupEventListeners();
    updateDashboard();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Add loan form
    document.getElementById('addLoanForm').addEventListener('submit', handleAddLoan);
    
    // Payment form
    document.getElementById('paymentForm').addEventListener('submit', handlePayment);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.add('hidden');
        }
    });
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication (in real app, this would be server-side)
    if (username === 'admin' && password === 'admin123') {
        currentUser = username;
        document.getElementById('currentUser').textContent = username;
        showDashboard();
    } else {
        alert('Invalid credentials. Please use admin/admin123');
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateDashboard();
}

// Logout
function logout() {
    currentUser = '';
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.getElementById('lendingSection').classList.add('hidden');
    document.getElementById('dailyCollectionSection').classList.add('hidden');
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section and activate sidebar item
    if (sectionName === 'lending') {
        document.getElementById('lendingSection').classList.remove('hidden');
        document.querySelector('.sidebar-nav li:nth-child(1)').classList.add('active');
        updateDashboard();
    } else if (sectionName === 'daily-collection') {
        document.getElementById('dailyCollectionSection').classList.remove('hidden');
        document.querySelector('.sidebar-nav li:nth-child(2)').classList.add('active');
        updateCollectionsDashboard();
    }
}

// Open add loan modal
function openAddLoanModal() {
    document.getElementById('addLoanModal').classList.remove('hidden');
    document.getElementById('addLoanForm').reset();
}

// Close add loan modal
function closeAddLoanModal() {
    document.getElementById('addLoanModal').classList.add('hidden');
}

// Handle add loan
function handleAddLoan(event) {
    event.preventDefault();
    
    const loan = {
        id: Date.now(),
        borrower: document.getElementById('borrowerName').value,
        loanAmount: parseFloat(document.getElementById('loanAmount').value),
        monthsToPay: parseInt(document.getElementById('monthsToPay').value),
        interestRate: parseFloat(document.getElementById('interestRate').value),
        collectionDate: document.getElementById('collectionDate').value,
        loanCollector: document.getElementById('loanCollector').value,
        dailyPayments: 0,
        borrowerBalance: 0,
        status: 'Ongoing',
        createdAt: new Date().toISOString()
    };
    
    // Calculate total loan and initial balance
    const interestAmount = loan.loanAmount * (loan.interestRate / 100);
    loan.totalLoan = loan.loanAmount + interestAmount;
    loan.borrowerBalance = loan.totalLoan;
    
    loans.push(loan);
    saveLoansToStorage();
    updateDashboard();
    closeAddLoanModal();
    
    // Show success message
    showNotification('Loan added successfully!', 'success');
}

// Open payment modal
function openPaymentModal(loanIndex) {
    selectedLoanIndex = loanIndex;
    const loan = loans[loanIndex];
    
    // Set max payment amount to current balance
    document.getElementById('paymentAmount').max = loan.borrowerBalance;
    document.getElementById('paymentAmount').placeholder = `Max: ₱${loan.borrowerBalance.toFixed(2)}`;
    
    document.getElementById('paymentModal').classList.remove('hidden');
    document.getElementById('paymentForm').reset();
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    selectedLoanIndex = -1;
}

// Handle payment
function handlePayment(event) {
    event.preventDefault();
    
    if (selectedLoanIndex === -1) return;
    
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const loan = loans[selectedLoanIndex];
    
    if (paymentAmount > loan.borrowerBalance) {
        alert('Payment amount cannot exceed the remaining balance.');
        return;
    }
    
    // Record collection
    const collection = {
        id: Date.now(),
        loanId: loan.id,
        borrower: loan.borrower,
        loanAmount: loan.loanAmount,
        paymentAmount: paymentAmount,
        previousBalance: loan.borrowerBalance,
        newBalance: loan.borrowerBalance - paymentAmount,
        collector: loan.loanCollector,
        collectionDate: new Date().toISOString(),
        status: 'Completed'
    };
    
    collections.push(collection);
    saveCollectionsToStorage();
    
    // Update loan data
    loan.dailyPayments += paymentAmount;
    loan.borrowerBalance -= paymentAmount;
    
    // Check if loan is fully paid
    if (loan.borrowerBalance <= 0) {
        loan.status = 'Paid';
        loan.borrowerBalance = 0;
    }
    
    saveLoansToStorage();
    updateDashboard();
    closePaymentModal();
    
    showNotification('Payment recorded successfully!', 'success');
}

// Delete loan
function deleteLoan(loanIndex) {
    if (confirm('Are you sure you want to delete this loan?')) {
        loans.splice(loanIndex, 1);
        saveLoansToStorage();
        updateDashboard();
        showNotification('Loan deleted successfully!', 'success');
    }
}

// Update dashboard
function updateDashboard() {
    updateSummaryCards();
    updateLoansTable();
}

// Update summary cards
function updateSummaryCards() {
    const totalBorrowers = loans.length;
    const totalLoans = loans.reduce((sum, loan) => sum + loan.totalLoan, 0);
    const activeLoans = loans.filter(loan => loan.status === 'Ongoing').length;
    const paidLoans = loans.filter(loan => loan.status === 'Paid').length;
    
    document.getElementById('totalBorrowers').textContent = totalBorrowers;
    document.getElementById('totalLoans').textContent = `₱${totalLoans.toFixed(2)}`;
    document.getElementById('activeLoans').textContent = activeLoans;
    document.getElementById('paidLoans').textContent = paidLoans;
}

// Update loans table
function updateLoansTable() {
    const tableBody = document.getElementById('loansTableBody');
    tableBody.innerHTML = '';
    
    loans.forEach((loan, index) => {
        const row = document.createElement('tr');
        
        // Calculate daily payment amount (total loan / (months * 30))
        const dailyPaymentAmount = loan.totalLoan / (loan.monthsToPay * 30);
        
        row.innerHTML = `
            <td><strong>${loan.borrower}</strong></td>
            <td>₱${loan.loanAmount.toFixed(2)}</td>
            <td>${loan.monthsToPay} months</td>
            <td>${loan.interestRate}%</td>
            <td>₱${loan.totalLoan.toFixed(2)}</td>
            <td>${formatDate(loan.collectionDate)}</td>
            <td>₱${loan.dailyPayments.toFixed(2)}</td>
            <td>${loan.loanCollector}</td>
            <td>₱${loan.borrowerBalance.toFixed(2)}</td>
            <td>
                <span class="status-badge status-${loan.status.toLowerCase()}">
                    ${loan.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${loan.status === 'Ongoing' ? 
                        `<button class="btn btn-pay" onclick="openPaymentModal(${index})">
                            <i class="fas fa-dollar-sign"></i> Pay
                        </button>` : ''
                    }
                    <button class="btn btn-edit" onclick="editLoan(${index})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="deleteLoan(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Edit loan (placeholder for future implementation)
function editLoan(loanIndex) {
    alert('Edit functionality will be implemented in the next version.');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Save loans to localStorage
function saveLoansToStorage() {
    localStorage.setItem('lendingLoans', JSON.stringify(loans));
}

// Load loans from localStorage
function loadLoansFromStorage() {
    const savedLoans = localStorage.getItem('lendingLoans');
    if (savedLoans) {
        loans = JSON.parse(savedLoans);
    }
}

// Save collections to localStorage
function saveCollectionsToStorage() {
    localStorage.setItem('lendingCollections', JSON.stringify(collections));
}

// Load collections from localStorage
function loadCollectionsFromStorage() {
    const savedCollections = localStorage.getItem('lendingCollections');
    if (savedCollections) {
        collections = JSON.parse(savedCollections);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add some sample data for demonstration
function addSampleData() {
    if (loans.length === 0) {
        const sampleLoans = [
            {
                id: 1,
                borrower: 'John Smith',
                loanAmount: 5000,
                monthsToPay: 12,
                interestRate: 10,
                collectionDate: '2024-12-31',
                loanCollector: 'Mike Johnson',
                dailyPayments: 1500,
                borrowerBalance: 4000,
                status: 'Ongoing',
                totalLoan: 5500,
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                borrower: 'Sarah Wilson',
                loanAmount: 3000,
                monthsToPay: 6,
                interestRate: 8,
                collectionDate: '2024-06-30',
                loanCollector: 'Lisa Brown',
                dailyPayments: 3240,
                borrowerBalance: 0,
                status: 'Paid',
                totalLoan: 3240,
                createdAt: '2024-01-10T14:30:00Z'
            },
            {
                id: 3,
                borrower: 'David Lee',
                loanAmount: 7500,
                monthsToPay: 18,
                interestRate: 12,
                collectionDate: '2025-06-30',
                loanCollector: 'Mike Johnson',
                dailyPayments: 500,
                borrowerBalance: 7900,
                status: 'Ongoing',
                totalLoan: 8400,
                createdAt: '2024-01-20T09:15:00Z'
            }
        ];
        
        loans = sampleLoans;
        saveLoansToStorage();
        updateDashboard();
    }
    
    // Add sample collections if none exist
    if (collections.length === 0) {
        const sampleCollections = [
            {
                id: 1,
                loanId: 1,
                borrower: 'John Smith',
                loanAmount: 5000,
                paymentAmount: 500,
                previousBalance: 5500,
                newBalance: 5000,
                collector: 'Mike Johnson',
                collectionDate: '2024-01-25T09:30:00Z',
                status: 'Completed'
            },
            {
                id: 2,
                loanId: 1,
                borrower: 'John Smith',
                loanAmount: 5000,
                paymentAmount: 1000,
                previousBalance: 5000,
                newBalance: 4000,
                collector: 'Mike Johnson',
                collectionDate: '2024-01-26T14:15:00Z',
                status: 'Completed'
            },
            {
                id: 3,
                loanId: 2,
                borrower: 'Sarah Wilson',
                loanAmount: 3000,
                paymentAmount: 3240,
                previousBalance: 3240,
                newBalance: 0,
                collector: 'Lisa Brown',
                collectionDate: '2024-01-27T11:45:00Z',
                status: 'Completed'
            },
            {
                id: 4,
                loanId: 3,
                borrower: 'David Lee',
                loanAmount: 7500,
                paymentAmount: 500,
                previousBalance: 8400,
                newBalance: 7900,
                collector: 'Mike Johnson',
                collectionDate: '2024-01-28T16:20:00Z',
                status: 'Completed'
            }
        ];
        
        collections = sampleCollections;
        saveCollectionsToStorage();
    }
}

// Initialize with sample data if no data exists
document.addEventListener('DOMContentLoaded', function() {
    loadLoansFromStorage();
    loadCollectionsFromStorage();
    setupEventListeners();
    addSampleData(); // Add sample data for demonstration
    updateDashboard();
});

// Daily Collection Functions

// Update collections dashboard
function updateCollectionsDashboard() {
    updateCollectionsSummaryCards();
    updateCollectionsTable();
}

// Update collections summary cards
function updateCollectionsSummaryCards() {
    const totalCollections = collections.length;
    const totalAmount = collections.reduce((sum, collection) => sum + collection.paymentAmount, 0);
    
    // Calculate today's collections
    const today = new Date().toDateString();
    const todayCollections = collections.filter(collection => 
        new Date(collection.collectionDate).toDateString() === today
    ).length;
    
    // Calculate average daily collection
    const averageDaily = totalCollections > 0 ? totalAmount / totalCollections : 0;
    
    document.getElementById('totalCollections').textContent = totalCollections;
    document.getElementById('totalCollectionAmount').textContent = `₱${totalAmount.toFixed(2)}`;
    document.getElementById('todayCollections').textContent = todayCollections;
    document.getElementById('averageDaily').textContent = `₱${averageDaily.toFixed(2)}`;
}

// Update collections table
function updateCollectionsTable() {
    const tableBody = document.getElementById('collectionsTableBody');
    tableBody.innerHTML = '';
    
    const collectionsToShow = filteredCollections.length > 0 ? filteredCollections : collections;
    
    // Sort collections by date (newest first)
    const sortedCollections = collectionsToShow.sort((a, b) => 
        new Date(b.collectionDate) - new Date(a.collectionDate)
    );
    
    sortedCollections.forEach((collection, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${formatDateTime(collection.collectionDate)}</strong></td>
            <td>${collection.borrower}</td>
            <td>₱${collection.loanAmount.toFixed(2)}</td>
            <td>₱${collection.paymentAmount.toFixed(2)}</td>
            <td>₱${collection.previousBalance.toFixed(2)}</td>
            <td>₱${collection.newBalance.toFixed(2)}</td>
            <td>${collection.collector}</td>
            <td>
                <span class="collection-status status-${collection.status.toLowerCase()}">
                    ${collection.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="viewCollectionDetails(${collection.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-delete" onclick="deleteCollection(${collection.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Toggle date filter
function toggleDateFilter() {
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.classList.toggle('hidden');
}

// Apply date filter
function applyDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // Include the entire end date
    
    filteredCollections = collections.filter(collection => {
        const collectionDate = new Date(collection.collectionDate);
        return collectionDate >= start && collectionDate <= end;
    });
    
    updateCollectionsTable();
    showNotification(`Filtered ${filteredCollections.length} collections`, 'success');
}

// Clear date filter
function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    filteredCollections = [];
    updateCollectionsTable();
    showNotification('Filter cleared', 'success');
}

// View collection details
function viewCollectionDetails(collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
        const details = `
Collection Details:
- Date & Time: ${formatDateTime(collection.collectionDate)}
- Borrower: ${collection.borrower}
- Loan Amount: ₱${collection.loanAmount.toFixed(2)}
- Payment Amount: ₱${collection.paymentAmount.toFixed(2)}
- Previous Balance: ₱${collection.previousBalance.toFixed(2)}
- New Balance: ₱${collection.newBalance.toFixed(2)}
- Collector: ${collection.collector}
- Status: ${collection.status}
        `;
        alert(details);
    }
}

// Delete collection
function deleteCollection(collectionId) {
    if (confirm('Are you sure you want to delete this collection record?')) {
        const index = collections.findIndex(c => c.id === collectionId);
        if (index !== -1) {
            collections.splice(index, 1);
            saveCollectionsToStorage();
            updateCollectionsDashboard();
            showNotification('Collection deleted successfully!', 'success');
        }
    }
}

// Export collections
function exportCollections() {
    const collectionsToExport = filteredCollections.length > 0 ? filteredCollections : collections;
    
    if (collectionsToExport.length === 0) {
        alert('No collections to export.');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date & Time,Borrower,Loan Amount,Payment Amount,Previous Balance,New Balance,Collector,Status\n';
    
    collectionsToExport.forEach(collection => {
        const row = [
            formatDateTime(collection.collectionDate),
            collection.borrower,
            `₱${collection.loanAmount.toFixed(2)}`,
            `₱${collection.paymentAmount.toFixed(2)}`,
            `₱${collection.previousBalance.toFixed(2)}`,
            `₱${collection.newBalance.toFixed(2)}`,
            collection.collector,
            collection.status
        ].map(value => `"${value}"`).join(',');
        csvContent += row + '\n';
    });
    
    // Add UTF-8 BOM to fix encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Collections exported successfully!', 'success');
} 