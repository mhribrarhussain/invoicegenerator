// ============================================
// Invoice Generator - Main JavaScript
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeInvoice();
    attachEventListeners();
    setDefaultDate();
    initializeNavbar();
});

// ============================================
// Initialization
// ============================================

function initializeInvoice() {
    // Generate and set invoice number
    const invoiceNumber = generateInvoiceNumber();
    document.getElementById('invoiceNumber').value = invoiceNumber;
    document.getElementById('previewInvoiceNumber').textContent = invoiceNumber;
    
    // Initialize calculations
    updateCalculations();
}

function setDefaultDate() {
    const dateInput = document.getElementById('invoiceDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    document.getElementById('previewDate').textContent = formatDate(today);
}

function initializeNavbar() {
    // Floating navbar on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    mobileMenuToggle.addEventListener('click', function() {
        navbarMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    const menuLinks = document.querySelectorAll('.navbar-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            navbarMenu.classList.remove('active');
        });
    });
}

// ============================================
// Invoice Number Generation
// ============================================

function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999 + 1).toString().padStart(4, '0');
    
    return `INV-${year}${month}${day}-${random}`;
}

// ============================================
// Event Listeners
// ============================================

function attachEventListeners() {
    // Form inputs - Live preview updates
    document.getElementById('businessName').addEventListener('input', updatePreview);
    document.getElementById('clientName').addEventListener('input', updatePreview);
    document.getElementById('invoiceDate').addEventListener('change', updatePreview);
    document.getElementById('taxRate').addEventListener('input', updateCalculations);
    document.getElementById('currency').addEventListener('change', updateCalculations);
    document.getElementById('paymentTerms').addEventListener('input', updatePreview);
    document.getElementById('invoiceNotes').addEventListener('input', updatePreview);
    
    // Toggle optional fields
    document.getElementById('toggleOptional').addEventListener('click', function() {
        const optionalFields = document.getElementById('optionalFields');
        const toggleBtn = this.querySelector('span');
        
        if (optionalFields.style.display === 'none') {
            optionalFields.style.display = 'block';
            toggleBtn.textContent = '− Hide Payment Terms / Notes';
        } else {
            optionalFields.style.display = 'none';
            toggleBtn.textContent = '+ Add Payment Terms / Notes';
        }
    });
    
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', addNewItem);
    
    // Item inputs (delegation for dynamic items)
    document.getElementById('itemsContainer').addEventListener('input', function(e) {
        if (e.target.classList.contains('item-name') || 
            e.target.classList.contains('item-quantity') || 
            e.target.classList.contains('item-price')) {
            updateCalculations();
        }
    });
    
    // Generate and Download buttons
    document.getElementById('generateBtn').addEventListener('click', generateInvoicePreview);
    document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
    document.getElementById('heroDownloadBtn').addEventListener('click', downloadPDF);
}

// ============================================
// Live Preview Updates
// ============================================

function updatePreview() {
    const businessName = document.getElementById('businessName').value || 'Your Business Name';
    const clientName = document.getElementById('clientName').value || 'Client Name';
    const invoiceDate = document.getElementById('invoiceDate').value;
    const paymentTerms = document.getElementById('paymentTerms').value;
    const invoiceNotes = document.getElementById('invoiceNotes').value;
    
    document.getElementById('previewBusinessName').textContent = businessName;
    document.getElementById('previewClientName').textContent = clientName;
    
    if (invoiceDate) {
        document.getElementById('previewDate').textContent = formatDate(invoiceDate);
    }
    
    // Update payment terms and notes
    const notesSection = document.getElementById('previewNotesSection');
    const paymentTermsDiv = document.getElementById('previewPaymentTermsDiv');
    const invoiceNotesDiv = document.getElementById('previewInvoiceNotesDiv');
    
    if (paymentTerms || invoiceNotes) {
        notesSection.style.display = 'block';
        
        if (paymentTerms) {
            paymentTermsDiv.style.display = 'block';
            document.getElementById('previewPaymentTerms').textContent = paymentTerms;
        } else {
            paymentTermsDiv.style.display = 'none';
        }
        
        if (invoiceNotes) {
            invoiceNotesDiv.style.display = 'block';
            document.getElementById('previewInvoiceNotes').textContent = invoiceNotes;
        } else {
            invoiceNotesDiv.style.display = 'none';
        }
    } else {
        notesSection.style.display = 'none';
    }
    
    updateCalculations();
}

// ============================================
// Item Management
// ============================================

function addNewItem() {
    const container = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <div class="form-group">
            <label>Item Name</label>
            <input type="text" class="item-name" placeholder="Service/Product" required>
        </div>
        <div class="form-group">
            <label>Quantity</label>
            <input type="number" class="item-quantity" value="1" min="1" required>
        </div>
        <div class="form-group">
            <label>Price</label>
            <input type="number" class="item-price" value="0" min="0" step="0.01" required>
        </div>
        <button type="button" class="btn-remove" onclick="removeItem(this)">✕</button>
    `;
    
    container.appendChild(itemRow);
    updateRemoveButtonsVisibility();
    updateCalculations();
}

function removeItem(button) {
    const itemRow = button.closest('.item-row');
    itemRow.remove();
    updateRemoveButtonsVisibility();
    updateCalculations();
}

function updateRemoveButtonsVisibility() {
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach((row, index) => {
        const removeBtn = row.querySelector('.btn-remove');
        if (itemRows.length > 1) {
            removeBtn.style.display = 'block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// ============================================
// Calculations
// ============================================

function updateCalculations() {
    const items = getInvoiceItems();
    let subtotal = 0;
    
    // Calculate subtotal
    items.forEach(item => {
        subtotal += item.quantity * item.price;
    });
    
    // Calculate tax
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    
    // Calculate total
    const total = subtotal + taxAmount;
    
    // Update form display
    document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
    document.getElementById('taxDisplay').textContent = formatCurrency(taxAmount);
    document.getElementById('totalDisplay').textContent = formatCurrency(total);
    
    // Update preview display
    document.getElementById('previewSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('previewTax').textContent = formatCurrency(taxAmount);
    document.getElementById('previewTotal').textContent = formatCurrency(total);
    
    // Update preview items table
    updatePreviewItemsTable(items);
}

function getInvoiceItems() {
    const itemRows = document.querySelectorAll('.item-row');
    const items = [];
    
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value || 'Untitled Item';
        const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        
        items.push({ name, quantity, price });
    });
    
    return items;
}

function updatePreviewItemsTable(items) {
    const tbody = document.getElementById('previewItemsBody');
    tbody.innerHTML = '';
    
    if (items.length === 0 || items.every(item => !item.name && item.quantity === 0 && item.price === 0)) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-items">No items added yet</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        const itemTotal = item.quantity * item.price;
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(itemTotal)}</td>
        `;
        tbody.appendChild(row);
    });
}

// ============================================
// Form Validation
// ============================================

function validateForm() {
    const businessName = document.getElementById('businessName').value.trim();
    const clientName = document.getElementById('clientName').value.trim();
    const invoiceDate = document.getElementById('invoiceDate').value;
    const items = getInvoiceItems();
    
    if (!businessName) {
        alert('Please enter your business name');
        document.getElementById('businessName').focus();
        return false;
    }
    
    if (!clientName) {
        alert('Please enter client name');
        document.getElementById('clientName').focus();
        return false;
    }
    
    if (!invoiceDate) {
        alert('Please select an invoice date');
        document.getElementById('invoiceDate').focus();
        return false;
    }
    
    const hasValidItem = items.some(item => item.name && item.quantity > 0 && item.price > 0);
    if (!hasValidItem) {
        alert('Please add at least one valid item with name, quantity, and price');
        return false;
    }
    
    return true;
}

// ============================================
// Generate Invoice Preview
// ============================================

function generateInvoicePreview() {
    if (!validateForm()) {
        return;
    }
    
    // Scroll to preview
    const preview = document.querySelector('.preview-card');
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight animation
    preview.style.boxShadow = '0 0 0 4px var(--primary-light)';
    setTimeout(() => {
        preview.style.boxShadow = '';
    }, 1000);
}

// ============================================
// PDF Generation
// ============================================

function downloadPDF() {
    if (!validateForm()) {
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get form data
    const businessName = document.getElementById('businessName').value;
    const clientName = document.getElementById('clientName').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceDate = formatDate(document.getElementById('invoiceDate').value);
    const items = getInvoiceItems();
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.quantity * item.price;
    });
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    
    // PDF Layout
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    
    // Header - Business Name
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(businessName, 20, yPos);
    
    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('INVOICE', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 15;
    
    // Divider
    doc.setDrawColor(25, 93, 230);
    doc.setLineWidth(1);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    yPos += 15;
    
    // Invoice Details
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Number:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(invoiceNumber, 70, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(invoiceDate, 70, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(clientName, 70, yPos);
    
    yPos += 20;
    
    // Items Table Header
    doc.setFillColor(246, 246, 248);
    doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 25, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Price', 145, yPos);
    doc.text('Total', pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 10;
    
    // Items
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        doc.text(item.name, 25, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(formatCurrency(item.price), 145, yPos);
        doc.text(formatCurrency(itemTotal), pageWidth - 25, yPos, { align: 'right' });
        yPos += 8;
    });
    
    yPos += 10;
    
    // Totals Section
    doc.setDrawColor(220);
    doc.line(120, yPos - 5, pageWidth - 20, yPos - 5);
    
    // Subtotal
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 120, yPos);
    doc.text(formatCurrency(subtotal), pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 8;
    
    // Tax
    const taxLabel = `Tax (${taxRate}%):`;
    doc.text(taxLabel, 120, yPos);
    doc.text(formatCurrency(taxAmount), pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 10;
    
    // Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setDrawColor(25, 93, 230);
    doc.line(120, yPos - 5, pageWidth - 20, yPos - 5);
    doc.text('Total:', 120, yPos);
    doc.setTextColor(25, 93, 230);
    doc.text(formatCurrency(total), pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 20;
    
    // Payment Terms and Notes
    const paymentTerms = document.getElementById('paymentTerms').value;
    const invoiceNotes = document.getElementById('invoiceNotes').value;
    
    if (paymentTerms) {
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Payment Terms:', 20, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(paymentTerms, 20, yPos);
        yPos += 12;
    }
    
    if (invoiceNotes) {
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 20, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const notesLines = doc.splitTextToSize(invoiceNotes, pageWidth - 40);
        doc.text(notesLines, 20, yPos);
        yPos += (notesLines.length * 5) + 10;
    }
    
    // Footer
    yPos = doc.internal.pageSize.height - 20;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    const filename = `Invoice-${invoiceNumber}.pdf`;
    doc.save(filename);
}

// ============================================
// Utility Functions
// ============================================

function formatCurrency(amount) {
    const currency = document.getElementById('currency').value;
    const symbols = {
        'USD': '$',
        'PKR': '₨',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹'
    };
    
    const symbol = symbols[currency] || '$';
    return symbol + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function scrollToInvoice() {
    const invoiceSection = document.getElementById('invoice-generator');
    invoiceSection.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// Smooth Scroll Animation on Load
// ============================================

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for animation
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.features-section, .how-section, .trust-section, .future-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    });
});
