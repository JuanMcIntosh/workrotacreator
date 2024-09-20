// Object to store holidays for each employee
let employeeHolidays = {};

// Call loadHolidays at the beginning of the file
loadHolidays();

// Function to load holidays from localStorage
function loadHolidays() {
  const savedHolidays = localStorage.getItem('employeeHolidays');
  if (savedHolidays) {
    employeeHolidays = JSON.parse(savedHolidays, (key, value) => {
      if (key === 'startDate' || key === 'endDate') {
        return new Date(value);
      }
      return value;
    });
  }
}

// Function to save holidays to localStorage
function saveHolidays() {
  localStorage.setItem('employeeHolidays', JSON.stringify(employeeHolidays));
}

// Function to add a holiday for an employee
function addHoliday(employeeName, startDate, endDate) {
  if (!employeeHolidays[employeeName]) {
    employeeHolidays[employeeName] = [];
  }
  employeeHolidays[employeeName].push({ startDate, endDate });
  saveHolidays();
}

// Function to remove a holiday for an employee
function removeHoliday(employeeName, startDate, endDate) {
  if (employeeHolidays[employeeName]) {
    employeeHolidays[employeeName] = employeeHolidays[employeeName].filter(
      holiday => !(holiday.startDate.getTime() === startDate.getTime() && 
                   holiday.endDate.getTime() === endDate.getTime())
    );
    saveHolidays();
  }
}

// Function to check if an employee is on holiday on a given date
function isEmployeeOnHoliday(employeeName, date) {
  if (!employeeHolidays[employeeName]) return false;
  
  return employeeHolidays[employeeName].some(holiday => 
    date >= holiday.startDate && date <= holiday.endDate
  );
}

// Function to get all holidays for an employee
function getEmployeeHolidays(employeeName) {
  return employeeHolidays[employeeName] || [];
}

// Function to clear all holidays for an employee
function clearEmployeeHolidays(employeeName) {
  employeeHolidays[employeeName] = [];
  saveHolidays();
}

// Function to get all employees with holidays
function getAllEmployeesWithHolidays() {
  return Object.keys(employeeHolidays);
}

// Function to initialize holidays for a new employee
function initializeEmployeeHolidays(employeeName) {
  if (!employeeHolidays[employeeName]) {
    employeeHolidays[employeeName] = [];
    saveHolidays();
  }
}

// Utility function to validate date format (YYYY-MM-DD)
function isValidDateFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
}

// Utility function to check if a date is within the current year
function isDateInCurrentYear(date) {
  const currentYear = new Date().getFullYear();
  return date.getFullYear() === currentYear;
}

// Function to add a holiday with validation
function addHolidayWithValidation(employeeName, startDateString, endDateString) {
  if (!isValidDateFormat(startDateString) || !isValidDateFormat(endDateString)) {
    throw new Error("Invalid date format. Please use YYYY-MM-DD.");
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date. Please enter a valid date.");
  }

  if (!isDateInCurrentYear(startDate) || !isDateInCurrentYear(endDate)) {
    throw new Error("Dates must be within the current year.");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date.");
  }

  addHoliday(employeeName, startDate, endDate);
}

// Export the functions
export {
  loadHolidays,
  addHolidayWithValidation,
  removeHoliday,
  isEmployeeOnHoliday,
  getEmployeeHolidays,
  clearEmployeeHolidays,
  getAllEmployeesWithHolidays,
  isValidDateFormat,
  isDateInCurrentYear,
  initializeEmployeeHolidays
};
