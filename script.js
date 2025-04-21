document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const monthlyPLValueEl = document.getElementById('monthly-pl-value');
    const formTitleEl = document.getElementById('form-title');
    const dateInput = document.getElementById('date');
    const profitLossInput = document.getElementById('profit-loss');
    const tradesInput = document.getElementById('trades');
    const saveDataBtn = document.getElementById('save-data');
    const deleteDataBtn = document.getElementById('delete-data');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveToFileBtn = document.getElementById('save-to-file');
    const loadFromFileBtn = document.getElementById('load-from-file');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const datePicker = document.getElementById('date-picker');
    const monthYearPickerEl = document.getElementById('month-year-picker');
    const prevMonthPickerBtn = document.getElementById('prev-month-picker');
    const nextMonthPickerBtn = document.getElementById('next-month-picker');
    const datePickerDaysEl = document.getElementById('date-picker-days');

    // Current date and displayed date
    const today = new Date();
    let currentDate = new Date();
    let displayedMonth = currentDate.getMonth();
    let displayedYear = currentDate.getFullYear();
    
    // Store trading data
    let tradingData = {};
    
    // File handle for saving
    let fileHandle = null;
    
    // Track if we're in edit mode
    let isEditMode = false;
    let originalDateKey = null;

    // Load data from localStorage
    loadFromLocalStorage();
    
    // Initialize calendar
    renderCalendar();
    
    // Event Listeners
    prevMonthBtn.addEventListener('click', showPreviousMonth);
    nextMonthBtn.addEventListener('click', showNextMonth);
    todayBtn.addEventListener('click', showCurrentMonth);
    
    dateInput.addEventListener('click', showDatePicker);
    
    prevMonthPickerBtn.addEventListener('click', () => {
        updatePickerMonth(-1);
    });
    
    nextMonthPickerBtn.addEventListener('click', () => {
        updatePickerMonth(1);
    });
    
    saveDataBtn.addEventListener('click', saveTradeData);
    deleteDataBtn.addEventListener('click', deleteTradeData);
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    saveToFileBtn.addEventListener('click', saveToLocalFile);
    loadFromFileBtn.addEventListener('click', loadFromLocalFile);
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', importData);
    
    // Close date picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!datePicker.contains(e.target) && e.target !== dateInput) {
            datePicker.classList.add('hidden');
        }
    });
    
    // Functions
    function renderCalendar() {
        // Clear existing rows except header
        const rows = calendarEl.querySelectorAll('.calendar-row');
        rows.forEach(row => row.remove());
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearEl.textContent = `${monthNames[displayedMonth]} ${displayedYear}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(displayedYear, displayedMonth, 1);
        const lastDay = new Date(displayedYear, displayedMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week of first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDay.getDay();
        
        // Calculate previous month's days to show
        const prevMonthLastDay = new Date(displayedYear, displayedMonth, 0).getDate();
        
        // Calculate total cells needed (max 6 rows of 7 days)
        const totalDays = firstDayOfWeek + daysInMonth;
        const totalRows = Math.ceil(totalDays / 7);
        
        // Generate calendar rows
        let date = 1;
        let nextMonthDate = 1;
        let weekNumber = 1;
        
        for (let i = 0; i < totalRows; i++) {
            const row = document.createElement('div');
            row.className = 'calendar-row';
            
            // Create week summary cell
            const weekSummaryCell = document.createElement('div');
            weekSummaryCell.className = 'calendar-cell week-summary';
            
            // Calculate week summary
            const weekStart = new Date(displayedYear, displayedMonth, (i * 7) + 1 - firstDayOfWeek);
            const weekStartFormatted = formatDate(weekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const weekEndFormatted = formatDate(weekEnd);
            
            // Get week's P/L data
            let weekPL = 0;
            let weekTrades = 0;
            
            for (let d = 0; d < 7; d++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(currentDate.getDate() + d);
                const dateKey = formatDate(currentDate);
                
                if (tradingData[dateKey]) {
                    weekPL += tradingData[dateKey].pl;
                    weekTrades += tradingData[dateKey].trades;
                }
            }
            
            weekSummaryCell.innerHTML = `
                <div>Week ${weekNumber}</div>
                <div class="${weekPL >= 0 ? 'profit' : 'loss'}">$${Math.abs(weekPL).toFixed(2)}</div>
                <div>${weekTrades} trades</div>
            `;
            
            // Create day cells for this row
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('div');
                cell.className = 'calendar-cell';
                
                // Previous month days
                if (i === 0 && j < firstDayOfWeek) {
                    const prevMonthDay = prevMonthLastDay - (firstDayOfWeek - j - 1);
                    cell.classList.add('other-month');
                    cell.innerHTML = `<div class="day-number">${prevMonthDay}</div>`;
                }
                // Current month days
                else if (date <= daysInMonth) {
                    // Check if this is today
                    const isToday = date === today.getDate() && 
                                   displayedMonth === today.getMonth() && 
                                   displayedYear === today.getFullYear();
                    
                    if (isToday) {
                        cell.classList.add('today');
                    }
                    
                    // Get trading data for this day
                    const dateObj = new Date(displayedYear, displayedMonth, date);
                    const dateKey = formatDate(dateObj);
                    let dayData = tradingData[dateKey] || { pl: 0, trades: 0 };
                    
                    // Create cell content
                    let cellContent = `<div class="day-number">${date}</div>`;
                    
                    if (dayData.pl !== 0 || dayData.trades !== 0) {
                        cellContent += `
                            <div class="day-pl ${dayData.pl >= 0 ? 'profit' : 'loss'}">$${Math.abs(dayData.pl).toFixed(2)}</div>
                            <div class="day-trades">${dayData.trades} trade${dayData.trades !== 1 ? 's' : ''}</div>
                            <div class="day-actions">
                                <button class="day-edit" data-date="${dateKey}">Edit</button>
                                <button class="day-delete" data-date="${dateKey}">Delete</button>
                            </div>
                        `;
                    }
                    
                    cell.innerHTML = cellContent;
                    
                    // Add click event to select date for new entries
                    cell.addEventListener('click', function(e) {
                        // Only select date if not clicking on edit/delete buttons
                        if (!e.target.classList.contains('day-edit') && 
                            !e.target.classList.contains('day-delete')) {
                            selectDate(dateObj);
                        }
                    });
                    
                    // Add edit button event listener
                    const editBtn = cell.querySelector('.day-edit');
                    if (editBtn) {
                        editBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const dateKey = this.getAttribute('data-date');
                            editTradeData(dateKey);
                        });
                    }
                    
                    // Add delete button event listener
                    const deleteBtn = cell.querySelector('.day-delete');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const dateKey = this.getAttribute('data-date');
                            if (confirm(`Are you sure you want to delete data for ${dateKey}?`)) {
                                delete tradingData[dateKey];
                                saveToLocalStorage();
                                renderCalendar();
                            }
                        });
                    }
                    
                    date++;
                }
                // Next month days
                else {
                    cell.classList.add('other-month');
                    cell.innerHTML = `<div class="day-number">${nextMonthDate}</div>`;
                    nextMonthDate++;
                }
                
                row.appendChild(cell);
            }
            
            // Add week summary cell to the row
            row.appendChild(weekSummaryCell);
            calendarEl.appendChild(row);
            weekNumber++;
        }
        
        // Update monthly P/L
        updateMonthlyPL();
    }
    
    function updateMonthlyPL() {
        let monthlyPL = 0;
        
        // Loop through all days in current month
        const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(displayedYear, displayedMonth, i);
            const dateKey = formatDate(dateObj);
            
            if (tradingData[dateKey]) {
                monthlyPL += tradingData[dateKey].pl;
            }
        }
        
        // Update display
        monthlyPLValueEl.textContent = `$${Math.abs(monthlyPL).toFixed(2)}`;
        monthlyPLValueEl.className = monthlyPL >= 0 ? 'profit' : 'loss';
    }
    
    function showPreviousMonth() {
        displayedMonth--;
        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }
        renderCalendar();
    }
    
    function showNextMonth() {
        displayedMonth++;
        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }
        renderCalendar();
    }
    
    function showCurrentMonth() {
        displayedMonth = today.getMonth();
        displayedYear = today.getFullYear();
        renderCalendar();
    }
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
    }
    
    function parseDate(dateString) {
        const parts = dateString.split('/');
        return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    
    function selectDate(date) {
        // Don't allow selection if in edit mode
        if (isEditMode) return;
        
        dateInput.value = formatDate(date);
        highlightElement(dateInput);
    }
    
    function showDatePicker() {
        // Don't show date picker if in edit mode
        if (isEditMode) return;
        
        // Position the date picker below the date input
        const inputRect = dateInput.getBoundingClientRect();
        datePicker.style.top = `${inputRect.bottom + window.scrollY + 5}px`;
        datePicker.style.left = `${inputRect.left + window.scrollX}px`;
        
        // Set the date picker to the current input date or today
        let pickerDate;
        if (dateInput.value) {
            pickerDate = parseDate(dateInput.value);
        } else {
            pickerDate = new Date();
        }
        
        // Update date picker display
        renderDatePicker(pickerDate.getMonth(), pickerDate.getFullYear(), pickerDate);
        
        // Show the date picker
        datePicker.classList.remove('hidden');
    }
    
    function renderDatePicker(month, year, selectedDate) {
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearPickerEl.textContent = `${monthNames[month]} ${year}`;
        
        // Clear previous days
        datePickerDaysEl.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week of first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDay.getDay();
        
        // Add days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'date-picker-day other-month';
            dayEl.textContent = prevMonthLastDay - (firstDayOfWeek - i - 1);
            datePickerDaysEl.appendChild(dayEl);
        }
        
        // Add days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'date-picker-day';
            dayEl.textContent = i;
            
            // Check if this day is selected
            if (selectedDate && 
                i === selectedDate.getDate() && 
                month === selectedDate.getMonth() && 
                year === selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }
            
            // Add click event
            dayEl.addEventListener('click', function() {
                const selectedDate = new Date(year, month, i);
                dateInput.value = formatDate(selectedDate);
                datePicker.classList.add('hidden');
                highlightElement(dateInput);
            });
            
            datePickerDaysEl.appendChild(dayEl);
        }
        
        // Add days from next month
        const totalCells = 42; // 6 rows of 7 days
        const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'date-picker-day other-month';
            dayEl.textContent = i;
            datePickerDaysEl.appendChild(dayEl);
        }
    }
    
    function updatePickerMonth(change) {
        // Get current picker month/year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const currentText = monthYearPickerEl.textContent;
        const parts = currentText.split(' ');
        let month = monthNames.indexOf(parts[0]);
        let year = parseInt(parts[1]);
        
        // Update month
        month += change;
        if (month < 0) {
            month = 11;
            year--;
        } else if (month > 11) {
            month = 0;
            year++;
        }
        
        // Re-render date picker
        let selectedDate = null;
        if (dateInput.value) {
            selectedDate = parseDate(dateInput.value);
        }
        
        renderDatePicker(month, year, selectedDate);
    }
    
    function saveTradeData() {
        const date = dateInput.value;
        const profitLoss = parseFloat(profitLossInput.value) || 0;
        const trades = parseInt(tradesInput.value) || 0;
        
        if (!date) {
            alert('Please select a date');
            return;
        }
        
        // If in edit mode and date was changed, delete the old entry
        if (isEditMode && originalDateKey !== date) {
            delete tradingData[originalDateKey];
        }
        
        // Save data
        tradingData[date] = {
            pl: profitLoss,
            trades: trades
        };
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Clear form and reset edit mode
        resetForm();
        
        // Update calendar
        renderCalendar();
        
        // Show success message
        alert('Data saved successfully');
    }
    
    function editTradeData(dateKey) {
        // Set edit mode
        isEditMode = true;
        originalDateKey = dateKey;
        
        // Update form title
        formTitleEl.textContent = 'Edit Trading Data';
        
        // Fill form with existing data
        dateInput.value = dateKey;
        profitLossInput.value = tradingData[dateKey].pl;
        tradesInput.value = tradingData[dateKey].trades;
        
        // Show delete and cancel buttons
        deleteDataBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');
        
        // Scroll to form
        document.querySelector('.data-entry-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    function deleteTradeData() {
        if (!isEditMode || !originalDateKey) return;
        
        if (confirm(`Are you sure you want to delete data for ${originalDateKey}?`)) {
            // Delete the data
            delete tradingData[originalDateKey];
            
            // Save to localStorage
            saveToLocalStorage();
            
            // Reset form and edit mode
            resetForm();
            
            // Update calendar
            renderCalendar();
            
            // Show success message
            alert('Data deleted successfully');
        }
    }
    
    function cancelEdit() {
        resetForm();
    }
    
    function resetForm() {
        // Reset edit mode
        isEditMode = false;
        originalDateKey = null;
        
        // Reset form title
        formTitleEl.textContent = 'Enter Trading Data';
        
        // Clear form
        dateInput.value = '';
        profitLossInput.value = '';
        tradesInput.value = '';
        
        // Hide delete and cancel buttons
        deleteDataBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');
    }
    
    function saveToLocalStorage() {
        try {
            localStorage.setItem('tradingCalendarData', JSON.stringify(tradingData));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem('tradingCalendarData');
            if (storedData) {
                tradingData = JSON.parse(storedData);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }
    
    async function saveToLocalFile() {
        try {
            // Convert data to JSON
            const jsonData = JSON.stringify(tradingData, null, 2);
            
            // Check if browser supports File System Access API
            if ('showSaveFilePicker' in window) {
                const options = {
                    suggestedName: 'trading_calendar_data.json',
                    types: [{
                        description: 'JSON Files',
                        accept: {
                            'application/json': ['.json']
                        }
                    }]
                };
                
                try {
                    fileHandle = await window.showSaveFilePicker(options);
                } catch (error) {
                    // User cancelled
                    if (error.name !== 'AbortError') {
                        console.error('Error with file picker:', error);
                    }
                    return;
                }
                
                // Create writable stream
                const writable = await fileHandle.createWritable();
                
                // Write data
                await writable.write(jsonData);
                
                // Close file
                await writable.close();
                
                alert('File saved successfully');
            } else {
                // Fallback for browsers that don't support File System Access API
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'trading_calendar_data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                URL.revokeObjectURL(url);
                
                alert('File saved successfully');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file: ' + error.message);
        }
    }
    
    async function loadFromLocalFile() {
        try {
            // File picker options
            const options = {
                types: [{
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json']
                    }
                }],
                multiple: false
            };
            
            // Show file picker
            let fileHandles;
            try {
                if ('showOpenFilePicker' in window) {
                    fileHandles = await window.showOpenFilePicker(options);
                    fileHandle = fileHandles[0];
                    
                    // Get file
                    const file = await fileHandle.getFile();
                    
                    // Read file contents
                    const contents = await file.text();
                    
                    // Parse JSON
                    tradingData = JSON.parse(contents);
                } else {
                    // Fallback for browsers that don't support File System Access API
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    
                    const promise = new Promise((resolve, reject) => {
                        input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (!file) {
                                reject(new Error('No file selected'));
                                return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                try {
                                    const contents = event.target.result;
                                    resolve(JSON.parse(contents));
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            reader.onerror = reject;
                            reader.readAsText(file);
                        };
                    });
                    
                    input.click();
                    tradingData = await promise;
                }
                
                // Save to localStorage
                saveToLocalStorage();
                
                // Update calendar
                renderCalendar();
                
                alert('Data loaded successfully');
            } catch (error) {
                // User cancelled or other error
                if (error.name !== 'AbortError') {
                    console.error('Error loading file:', error);
                    alert('Error loading file: ' + error.message);
                }
            }
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Error loading file: ' + error.message);
        }
    }
    
    function exportData() {
        // Convert data to CSV
        let csv = 'Date,Profit/Loss,Trades\n';
        
        for (const date in tradingData) {
            const data = tradingData[date];
            csv += `${date},${data.pl},${data.trades}\n`;
        }
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trading_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const csv = event.target.result;
                const lines = csv.split('\n');
                
                // Clear existing data
                tradingData = {};
                
                // Skip header line
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const parts = lines[i].split(',');
                    const date = parts[0];
                    const pl = parseFloat(parts[1]);
                    const trades = parseInt(parts[2]);
                    
                    tradingData[date] = {
                        pl: pl,
                        trades: trades
                    };
                }
                
                // Save to localStorage
                saveToLocalStorage();
                
                renderCalendar();
                alert('Data imported successfully');
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    function highlightElement(element) {
        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, 1000);
    }
});
