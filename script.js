// Employee class
class Employee {
  constructor(name, weekdayRate) {
      this.name = name;
      this.weekdayRate = weekdayRate;
      this.unavailableDates = [];
      this.recurringUnavailability = [];
      this.assignedShifts = [];
      this.totalHours = 0;
      this.totalPay = 0;
  }
}

// Shift class
class Shift {
  constructor(date, type, startTime, endTime, rate) {
      this.date = date;
      this.type = type;
      this.startTime = startTime;
      this.endTime = endTime;
      this.rate = rate;
  }
}

// Global variables
let employees = [];
let startDate;
let endDate;
const standardWeekdayRate = 15; // Set a standard weekday rate for all employees

// DOM Elements
const addEmployeeBtn = document.getElementById('addEmployee');
const generateRotaBtn = document.getElementById('generateRota');
const employeeNameInput = document.getElementById('employeeName');
const startDateInput = document.getElementById('startDate');
const employeeListDiv = document.getElementById('employeeList');
const rotaOutputDiv = document.getElementById('rotaOutput');
const employeeSelect = document.getElementById('employeeSelect');
const unavailableDatesCalendar = document.getElementById('unavailableDatesCalendar');
const recurringDaysCheckboxes = document.querySelectorAll('#recurringDays input[type="checkbox"]');
const unavailableTypeRadios = document.getElementsByName('unavailableType');
const addUnavailableDateBtn = document.getElementById('addUnavailableDate');

// Event Listeners
addEmployeeBtn.addEventListener('click', addEmployee);
generateRotaBtn.addEventListener('click', generateRota);
addUnavailableDateBtn.addEventListener('click', addUnavailableDate);
unavailableTypeRadios.forEach(radio => {
  radio.addEventListener('change', toggleUnavailableInputs);
});

// Add this new event listener
employeeNameInput.addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    addEmployee();
  }
});

// Initialize Flatpickr
flatpickr(unavailableDatesCalendar, {
  mode: "multiple",
  dateFormat: "Y-m-d",
});

function addEmployee() {
  const name = employeeNameInput.value.trim();
  if (name) {
      const employee = new Employee(name, standardWeekdayRate);
      employees.push(employee);
      updateEmployeeList();
      updateEmployeeSelect();
      employeeNameInput.value = '';
  }
}

function updateEmployeeList() {
  employeeListDiv.innerHTML = '';
  employees.forEach((employee, index) => {
      const employeeDiv = document.createElement('div');
      employeeDiv.innerHTML = `
          <strong>${employee.name}</strong>
          <div class="unavailable-dates">
              ${employee.unavailableDates.map(date => `
                  <span class="unavailable-date">
                      ${formatDate(date)}
                      <span class="remove-date" data-employee="${index}" data-date="${date.toISOString()}" data-type="single">×</span>
                  </span>
              `).join('')}
              ${employee.recurringUnavailability.map((day, i) => `
                  <span class="unavailable-date">
                      Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}
                      <span class="remove-date" data-employee="${index}" data-day="${day}" data-type="recurring">×</span>
                  </span>
              `).join('')}
          </div>
      `;
      employeeListDiv.appendChild(employeeDiv);
  });

  // Add event listeners for removing unavailable dates
  document.querySelectorAll('.remove-date').forEach(elem => {
      elem.addEventListener('click', removeUnavailableDate);
  });
}

function updateEmployeeSelect() {
  employeeSelect.innerHTML = '';
  employees.forEach((employee, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = employee.name;
      employeeSelect.appendChild(option);
  });
}

function toggleUnavailableInputs() {
  const selectedType = document.querySelector('input[name="unavailableType"]:checked').value;
  document.getElementById('datesInput').style.display = selectedType === 'dates' ? 'block' : 'none';
  document.getElementById('recurringInput').style.display = selectedType === 'recurring' ? 'block' : 'none';
}

function addUnavailableDate() {
  const employeeIndex = employeeSelect.value;
  const selectedType = document.querySelector('input[name="unavailableType"]:checked').value;
  
  if (employeeIndex === '') return;
  
  const employee = employees[employeeIndex];

  if (selectedType === 'dates') {
    const selectedDates = unavailableDatesCalendar.value.split(',');
    selectedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (date && !employee.unavailableDates.some(d => d.getTime() === date.getTime())) {
        employee.unavailableDates.push(date);
      }
    });
  } else if (selectedType === 'recurring') {
    recurringDaysCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const day = parseInt(checkbox.value);
        if (!employee.recurringUnavailability.includes(day)) {
          employee.recurringUnavailability.push(day);
        }
      }
    });
  }

  updateEmployeeList();
  unavailableDatesCalendar.value = '';
  recurringDaysCheckboxes.forEach(checkbox => checkbox.checked = false);
}

function removeUnavailableDate(event) {
  const employeeIndex = event.target.dataset.employee;
  const type = event.target.dataset.type;
  const employee = employees[employeeIndex];

  if (type === 'single') {
      const dateStr = event.target.dataset.date;
      employee.unavailableDates = employee.unavailableDates.filter(date => date.toISOString() !== dateStr);
  } else if (type === 'recurring') {
      const day = parseInt(event.target.dataset.day);
      employee.recurringUnavailability = employee.recurringUnavailability.filter(d => d !== day);
  }

  updateEmployeeList();
}

function generateRota() {
  startDate = new Date(startDateInput.value);
  if (!startDate || employees.length === 0) {
      alert('Please select a start date and add employees.');
      return;
  }
  
  endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(24);
  
  const rota = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend) {
          if (dayOfWeek === 6) { // Saturday
              const longShift = createShift(currentDate, 'Saturday Long', '12:30', '20:30', 1.5);
              const shortShift = createShift(currentDate, 'Saturday Short', '12:30', '16:30', 1.5);
              
              assignShift(longShift, rota);
              assignShift(shortShift, rota);
          } else { // Sunday
              const morningShift = createShift(currentDate, 'Sunday Morning', '08:30', '12:30', 2);
              const longShift = createShift(currentDate, 'Sunday Long', '08:30', '20:30', 2);
              
              assignShift(morningShift, rota);
              assignShift(longShift, rota);
          }
          
          // Weekend duty (for both Saturday and Sunday)
          const weekendDuty = createShift(currentDate, 'Weekend Duty', '20:30', '08:30', dayOfWeek === 0 ? 2 : 1.5);
          assignShift(weekendDuty, rota);
      } else {
          // Weekday shifts
          const session = createShift(currentDate, 'Weekday Session', '16:30', '20:30', 1);
          const duty = createShift(currentDate, 'Weekday Duty', '20:30', '08:30', 1);
          
          assignShift(session, rota);
          assignShift(duty, rota);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
  }
  
  balanceWorkload(rota);
  displayRota(rota);
}

function createShift(date, type, startTime, endTime, rate) {
  return new Shift(new Date(date), type, startTime, endTime, rate);
}

function assignShift(shift, rota) {
  const availableEmployees = employees.filter(employee => 
      isEmployeeAvailable(employee, shift.date) && 
      !hasWorkedPreviousDay(employee, shift.date)
  );
  
  if (availableEmployees.length === 0) {
      console.error('No available employees for shift:', shift);
      return;
  }
  
  const employee = getRandomEmployee(availableEmployees);
  employee.assignedShifts.push(shift);
  rota.push({ employee, shift });
  
  updateEmployeeStats(employee, shift);
}

function isEmployeeAvailable(employee, date) {
  const isUnavailableDate = employee.unavailableDates.some(unavailableDate => 
      unavailableDate.toDateString() === date.toDateString()
  );
  const isRecurringUnavailable = employee.recurringUnavailability.includes(date.getDay());
  return !isUnavailableDate && !isRecurringUnavailable;
}

function hasWorkedPreviousDay(employee, date) {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  return employee.assignedShifts.some(shift => 
      shift.date.toDateString() === previousDay.toDateString()
  );
}

function getRandomEmployee(availableEmployees) {
  return availableEmployees[Math.floor(Math.random() * availableEmployees.length)];
}

function updateEmployeeStats(employee, shift) {
  const shiftHours = calculateShiftHours(shift);
  employee.totalHours += shiftHours;
  employee.totalPay += shiftHours * employee.weekdayRate * shift.rate;
}

function calculateShiftHours(shift) {
  const start = new Date(`2000-01-01T${shift.startTime}`);
  const end = new Date(`2000-01-01T${shift.endTime}`);
  if (end < start) end.setDate(end.getDate() + 1);
  return (end - start) / (1000 * 60 * 60);
}

function balanceWorkload(rota) {
  const targetHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0) / employees.length;
  const targetPay = employees.reduce((sum, emp) => sum + emp.totalPay, 0) / employees.length;
  
  rota.sort((a, b) => {
      const scoreDiffA = Math.abs(a.employee.totalHours - targetHours) + Math.abs(a.employee.totalPay - targetPay);
      const scoreDiffB = Math.abs(b.employee.totalHours - targetHours) + Math.abs(b.employee.totalPay - targetPay);
      return scoreDiffB - scoreDiffA;
  });
  
  for (let i = 0; i < rota.length - 1; i++) {
      for (let j = i + 1; j < rota.length; j++) {
          if (canSwapShifts(rota[i], rota[j])) {
              swapShifts(rota[i], rota[j]);
              if (isWorkloadBalanced()) break;
          }
      }
      if (isWorkloadBalanced()) break;
  }
}

function canSwapShifts(assignment1, assignment2) {
  return isEmployeeAvailable(assignment1.employee, assignment2.shift.date) &&
         isEmployeeAvailable(assignment2.employee, assignment1.shift.date) &&
         !hasWorkedPreviousDay(assignment1.employee, assignment2.shift.date) &&
         !hasWorkedPreviousDay(assignment2.employee, assignment1.shift.date);
}

function swapShifts(assignment1, assignment2) {
  const tempShift = assignment1.shift;
  assignment1.shift = assignment2.shift;
  assignment2.shift = tempShift;
  
  updateEmployeeStats(assignment1.employee, assignment1.shift);
  updateEmployeeStats(assignment2.employee, assignment2.shift);
}

function isWorkloadBalanced() {
  const avgHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0) / employees.length;
  const avgPay = employees.reduce((sum, emp) => sum + emp.totalPay, 0) / employees.length;
  
  return employees.every(emp => 
      Math.abs(emp.totalHours - avgHours) <= 4 && 
      Math.abs(emp.totalPay - avgPay) <= avgPay * 0.1
  );
}

function displayRota(rota) {
  rotaOutputDiv.innerHTML = '';
  
  // Sort rota by date in ascending order
  rota.sort((a, b) => a.shift.date - b.shift.date);

  const table = document.createElement('table');
  table.innerHTML = `
      <tr>
          <th>Date</th>
          <th>Shift Type</th>
          <th>Employee</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Rate</th>
      </tr>
  `;
  
  rota.forEach(assignment => {
      const row = table.insertRow();
      row.innerHTML = `
          <td>${formatDate(assignment.shift.date)}</td>
          <td>${assignment.shift.type}</td>
          <td>${assignment.employee.name}</td>
          <td>${assignment.shift.startTime}</td>
          <td>${assignment.shift.endTime}</td>
          <td>${assignment.shift.rate}x</td>
      `;
  });
  
  rotaOutputDiv.appendChild(table);
  
  // Display employee stats
  const statsDiv = document.createElement('div');
  statsDiv.innerHTML = '<h3>Employee Statistics</h3>';
  employees.forEach(employee => {
      statsDiv.innerHTML += `
          <p>${employee.name}: ${employee.totalHours.toFixed(2)} hours, $${employee.totalPay.toFixed(2)} total pay</p>
      `;
  });
  rotaOutputDiv.appendChild(statsDiv);

  // Add download PDF button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download as PDF';
  downloadBtn.addEventListener('click', () => downloadPDF(rota));
  rotaOutputDiv.appendChild(downloadBtn);
}

function downloadPDF(rota) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set font styles
  doc.setFont("helvetica");
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 26); // #1a1a1a

  // Add title
  doc.text('Work Rota', 14, 20);

  // Set table styles
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51); // #333333
  const tableStartY = 30;
  const cellPadding = 2;
  const lineHeight = 7;

  // Define columns
  const columns = [
    { header: 'Date', width: 40 },
    { header: 'Sessions', width: 75 },
    { header: 'Duties', width: 75 }
  ];

  // Draw table header
  let currentX = 14;
  let currentY = tableStartY;
  doc.setFillColor(240, 240, 240); // #f0f0f0
  doc.rect(currentX, currentY, 190, lineHeight, 'F');
  doc.setFont("helvetica", "bold");
  columns.forEach(column => {
    doc.text(column.header, currentX + cellPadding, currentY + 5);
    currentX += column.width;
  });
  currentY += lineHeight;

  // Group rota by date
  const rotaByDate = rota.reduce((acc, assignment) => {
    const dateStr = formatDate(assignment.shift.date);
    if (!acc[dateStr]) {
      acc[dateStr] = { sessions: [], duties: [] };
    }
    if (assignment.shift.type.includes('Session')) {
      acc[dateStr].sessions.push(assignment);
    } else {
      acc[dateStr].duties.push(assignment);
    }
    return acc;
  }, {});

  // Draw table rows
  doc.setFont("helvetica", "normal");
  Object.entries(rotaByDate).forEach(([date, shifts], index) => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }

    currentX = 14;
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 249); // #f9f9f9
      doc.rect(currentX, currentY, 190, lineHeight, 'F');
    }

    // Date column
    doc.text(date, currentX + cellPadding, currentY + 5);
    currentX += columns[0].width;

    // Sessions column
    const sessionsText = shifts.sessions.map(s => `${s.employee.name} (${s.shift.startTime}-${s.shift.endTime})`).join('\n');
    doc.text(sessionsText, currentX + cellPadding, currentY + 5);
    currentX += columns[1].width;

    // Duties column
    const dutiesText = shifts.duties.map(s => `${s.employee.name} (${s.shift.startTime}-${s.shift.endTime})`).join('\n');
    doc.text(dutiesText, currentX + cellPadding, currentY + 5);

    currentY += Math.max(sessionsText.split('\n').length, dutiesText.split('\n').length) * lineHeight;
  });

  // Add employee statistics
  currentY += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('Employee Statistics', 14, currentY);
  currentY += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Standard Weekday Rate: $${standardWeekdayRate}/hr`, 14, currentY);
  currentY += lineHeight;

  employees.forEach(employee => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    const text = `${employee.name}: ${employee.totalHours.toFixed(2)} hours, $${employee.totalPay.toFixed(2)} total pay`;
    doc.text(text, 14, currentY);
    currentY += lineHeight;
  });

  doc.save('work_rota.pdf');
}

function formatDate(date) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Initialize the page
toggleUnavailableInputs();