document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Portfolio filtering (on portfolio.html)
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (filterButtons.length > 0 && portfolioItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');

                const filterValue = this.getAttribute('data-filter');

                portfolioItems.forEach(item => {
                    if (filterValue === 'all' || item.classList.contains(filterValue)) {
                        item.style.display = 'block'; // Show item
                    } else {
                        item.style.display = 'none'; // Hide item
                    }
                });
            });
        });
    }

    // Auto-fill service in contact form if coming from services page
    const contactFormServiceSelect = document.getElementById('service');
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');

    if (contactFormServiceSelect && serviceParam) {
        // Simple mapping from URL parameter to Arabic service name
        const serviceMap = {
            'content-writing': 'كتابة المحتوى والترجمة',
            'graphic-design': 'التصميم الجرافيكي',
            'web-dev': 'تطوير الويب والتطبيقات',
            'network-it': 'برمجة وتركيب الشبكات',
            'digital-marketing': 'التسويق الرقمي',
            'data-entry': 'إدخال البيانات',
            'info-security': 'أمن المعلومات',
            'erp-maint': 'الأنظمة الإدارية والمحاسبية'
        };
        const arabicServiceName = serviceMap[serviceParam];
        if (arabicServiceName) {
            contactFormServiceSelect.value = arabicServiceName;
        }
    }
});