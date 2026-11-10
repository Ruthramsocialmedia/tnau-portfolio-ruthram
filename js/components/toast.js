// toast.js - Reusable toast notification system

/**
 * Shows a toast notification.
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = 'info') {
    // Check if container exists, if not create it
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: '9999'
        });
        document.body.appendChild(container);
    }

    // Colors based on type
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'var(--color-accent-600, #1E7A45)';
            icon = '<i class="fa-solid fa-circle-check"></i>';
            break;
        case 'error':
            bgColor = 'var(--color-warm-600, #E06610)';
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
            break;
        default:
            bgColor = 'var(--color-primary-700, #1E3A5F)';
            icon = '<i class="fa-solid fa-circle-info"></i>';
    }

    // Create toast element
    const toast = document.createElement('div');
    Object.assign(toast.style, {
        backgroundColor: bgColor,
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        transform: 'translateX(120%)',
        transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease',
        opacity: '0'
    });

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Trigger animation in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // Wait for animation to finish
    }, 3000);
}
