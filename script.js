// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    displayTodayDate();
    loadProgressFromStorage();
    updateCompletionStats();
});

// Display today's date
function displayTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today-display').textContent = today.toLocaleDateString('en-US', options);
}

// Save day's progress
function saveDay(day) {
    const dayLower = day.toLowerCase().substring(0, 3);
    const checkbox = document.getElementById(`${dayLower}-stretch`);
    
    const progress = JSON.parse(localStorage.getItem('healthyHabitsProgress')) || {};
    progress[day] = {
        stretch: checkbox.checked,
        savedAt: new Date().toLocaleString()
    };
    
    localStorage.setItem('healthyHabitsProgress', JSON.stringify(progress));
    showToast(`${day}'s progress saved! ✓`);
    updateCardUI(day);
    updateCompletionStats();
}

// Load progress from localStorage
function loadProgressFromStorage() {
    const progress = JSON.parse(localStorage.getItem('healthyHabitsProgress')) || {};
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
        if (progress[day]) {
            const dayLower = day.toLowerCase().substring(0, 3);
            const checkbox = document.getElementById(`${dayLower}-stretch`);
            checkbox.checked = progress[day].stretch;
            updateCardUI(day);
        }
    });
}

// Update card UI based on completion status
function updateCardUI(day) {
    const card = document.querySelector(`[data-day="${day}"]`);
    const progress = JSON.parse(localStorage.getItem('healthyHabitsProgress')) || {};
    
    if (progress[day] && progress[day].stretch) {
        card.classList.add('completed');
    } else {
        card.classList.remove('completed');
    }
}

// Update completion statistics
function updateCompletionStats() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const progress = JSON.parse(localStorage.getItem('healthyHabitsProgress')) || {};
    
    let completedDays = 0;
    
    days.forEach(day => {
        if (progress[day] && progress[day].stretch) {
            completedDays++;
        }
    });
    
    const completionPercent = Math.round((completedDays / days.length) * 100);
    const completionBar = document.getElementById('completion-bar');
    const completionPercent_display = document.getElementById('completion-percent');
    
    completionBar.style.width = completionPercent + '%';
    completionPercent_display.textContent = completionPercent + '%';
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Reset the entire week
function resetWeek() {
    if (confirm('Are you sure you want to reset the entire week? This cannot be undone.')) {
        localStorage.removeItem('healthyHabitsProgress');
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            const dayLower = day.toLowerCase().substring(0, 3);
            const checkbox = document.getElementById(`${dayLower}-stretch`);
            checkbox.checked = false;
            updateCardUI(day);
        });
        
        updateCompletionStats();
        showToast('Week reset! 🔄');
    }
}

// Export progress data
function exportData() {
    const progress = JSON.parse(localStorage.getItem('healthyHabitsProgress')) || {};
    const today = new Date().toISOString().split('T')[0];
    
    let exportText = `Healthy Habits Progress Report\nDate: ${today}\n\n`;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
        exportText += `${day}:\n`;
        if (progress[day]) {
            exportText += `  Stretch/Exercise: ${progress[day].stretch ? '✓ Done' : '✗ Not Done'}\n`;
            exportText += `  Last saved: ${progress[day].savedAt}\n`;
        } else {
            exportText += `  Stretch/Exercise: Not tracked\n`;
        }
        exportText += '\n';
    });
    
    // Calculate stats
    let completedDays = 0;
    days.forEach(day => {
        if (progress[day] && progress[day].stretch) {
            completedDays++;
        }
    });
    
    const completionPercent = Math.round((completedDays / days.length) * 100);
    exportText += `Weekly Completion Rate: ${completionPercent}%\n`;
    exportText += `Days Completed: ${completedDays}/7\n`;
    
    // Create downloadable file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthy-habits-${today}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showToast('Progress exported! 📥');
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        saveDay(dayName);
    }
});
