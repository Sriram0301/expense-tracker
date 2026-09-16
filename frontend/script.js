const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

const API_URL = "http://127.0.0.1:8000";

let currentPage = 1;
const expensesPerPage = 5;
let currentFilteredExpenses = [];

function showMessage(message, type) {
    const messageBox =
        document.getElementById("app-message");

    messageBox.textContent = message;

    messageBox.className = type;

    setTimeout(function() {
        messageBox.textContent = "";
        messageBox.className = "";
    }, 3000);
}

async function loadExpenses() {
    const container =
        document.getElementById("expense-container");

    container.innerHTML =
        "<p>Loading expenses...</p>";

    try {
        const response = await fetch(`${API_URL}/expenses`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }

            container.innerHTML =
                "<p>Failed to load expenses.</p>";
            return;
        }

        const expenses = await response.json();

        allExpenses = expenses;

        displayExpenses(expenses);
        loadCategorySummary(expenses);
        loadStatistics(expenses);

    } catch (error) {
        console.error("Load expenses error:", error);

        container.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}


function displayExpenses(expenses) {

    const container =
        document.getElementById("expense-container");

    container.innerHTML = "";

    currentFilteredExpenses = expenses;

    if (expenses.length === 0) {

        container.innerHTML =
            "<p>No expenses found.</p>";

        updatePagination();

        return;
    }

    const startIndex =
        (currentPage - 1) * expensesPerPage;

    const endIndex =
        startIndex + expensesPerPage;

    const pageExpenses =
        expenses.slice(startIndex, endIndex);


    pageExpenses.forEach(function(expense) {

        const expenseItem =
            document.createElement("div");

        expenseItem.className =
            "expense-item";

        expenseItem.innerHTML = `
            <div>
                <strong>${expense.category}</strong>
                <p>${expense.description}</p>
                <small>${expense.expense_date}</small>
            </div>

            <div>
                <strong>₹${expense.amount}</strong>

                <button onclick="editExpense(${expense.id})">
                    Edit
                </button>

                <button onclick="deleteExpense(${expense.id})">
                    Delete
                </button>
            </div>
        `;

        container.appendChild(expenseItem);
    });

    updatePagination();
}

let allExpenses = [];

function filterExpenses() {
    currentPage = 1;

    function filterExpenses() {

    currentPage = 1;

    const selectedCategory =
            document.getElementById("filter-category").value;

        // rest of your existing code...
    }
    const selectedCategory =
        document.getElementById("filter-category").value;

    const selectedMonth =
        document.getElementById("filter-month").value;
    
    const fromDate =
        document.getElementById("filter-from-date").value;

    const toDate =
        document.getElementById("filter-to-date").value;

    const searchText =
        document.getElementById("search-expense").value
        .toLowerCase()
        .trim();

    const selectedSort =
        document.getElementById("sort-expenses").value;

    let filteredExpenses = allExpenses.filter(
        function(expense) {

            const categoryMatches =
                selectedCategory === "all" ||
                expense.category === selectedCategory;

            const monthMatches =
                !selectedMonth ||
                expense.expense_date.startsWith(selectedMonth);

            const fromDateMatches =
                !fromDate ||
                expense.expense_date >= fromDate;

            const toDateMatches =
                !toDate ||
                expense.expense_date <= toDate;

            const searchMatches =
                expense.description.toLowerCase().includes(searchText) ||
                expense.category.toLowerCase().includes(searchText);

            return (
                categoryMatches &&
                monthMatches &&
                fromDateMatches &&
                toDateMatches &&
                searchMatches
            );
        }
    );

    filteredExpenses.sort(function(a, b) {

        if (selectedSort === "newest") {
            return new Date(b.expense_date) -
                   new Date(a.expense_date);
        }

        if (selectedSort === "oldest") {
            return new Date(a.expense_date) -
                   new Date(b.expense_date);
        }

        if (selectedSort === "highest") {
            return b.amount - a.amount;
        }

        if (selectedSort === "lowest") {
            return a.amount - b.amount;
        }

    });

    displayExpenses(filteredExpenses);
}

function updatePagination() {

    const totalPages =
        Math.ceil(
            currentFilteredExpenses.length /
            expensesPerPage
        );

    const pageInfo =
        document.getElementById("page-info");

    const previousButton =
        document.getElementById("prev-page");

    const nextButton =
        document.getElementById("next-page");


    if (totalPages === 0) {

        pageInfo.textContent =
            "Page 0 of 0";

    } else {

        pageInfo.textContent =
            `Page ${currentPage} of ${totalPages}`;
    }


    previousButton.disabled =
        currentPage === 1;

    nextButton.disabled =
        currentPage >= totalPages;
}

function goToPreviousPage() {

    if (currentPage > 1) {

        currentPage--;

        displayExpenses(
            currentFilteredExpenses
        );
    }
}

function goToNextPage() {

    const totalPages =
        Math.ceil(
            currentFilteredExpenses.length /
            expensesPerPage
        );

    if (currentPage < totalPages) {

        currentPage++;

        displayExpenses(
            currentFilteredExpenses
        );
    }
}

const addExpenseButton = document.getElementById("add-expense-btn");

addExpenseButton.addEventListener("click", addExpense);


async function addExpense() {

    const addButton =
        document.getElementById("add-expense-btn");

    const message =
        document.getElementById("message");

    addButton.disabled = true;
    addButton.textContent = "Adding...";

    const category =
        document.getElementById("category").value;

    const description =
        document.getElementById("description").value.trim();

    const amount =
        document.getElementById("amount").value;

    const expenseDate =
        document.getElementById("expense-date").value;


    try {

        // Validation

        if (!category || !description || !amount || !expenseDate) {

            message.textContent =
                "Please fill all fields.";

            return;
        }

        if (description.length < 2) {

            message.textContent =
                "Description must contain at least 2 characters.";

            return;
        }

        if (description.length > 200) {

            message.textContent =
                "Description cannot exceed 200 characters.";

            return;
        }

        const numericAmount = Number(amount);

        if (isNaN(numericAmount) || numericAmount <= 0) {

            message.textContent =
                "Amount must be greater than 0.";

            return;
        }


        const expenseData = {
            category: category,
            description: description,
            amount: numericAmount,
            expense_date: expenseDate
        };


        const response = await fetch(
            `${API_URL}/expenses`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(expenseData)
            }
        );


        const result = await response.json();


        if (!response.ok) {

            console.log("Add expense error:", result);

            message.textContent =
                result.detail || "Failed to add expense.";

            return;
        }


        message.textContent =
            "Expense added successfully! ✅";


        // Clear form

        document.getElementById("category").value = "";
        document.getElementById("description").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("expense-date").value = "";


        // Refresh dashboard

        loadExpenses();
        loadTotal();
        loadThisMonth();


    } catch (error) {

        console.error("Add expense error:", error);

        message.textContent =
            "Unable to connect to the server.";

    } finally {

        // Always restore button

        addButton.disabled = false;
        addButton.textContent = "Add Expense";
    }
}

async function loadTotal() {
    try {
        const response = await fetch(`${API_URL}/total`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }

            console.log("Failed to load total");
            return;
        }

        const data = await response.json();

        document.getElementById("total-expenses").textContent =
            `₹${data.total}`;

    } catch (error) {
        console.error("Load total error:", error);
    }
}

async function loadThisMonth() {
    try {
        const response = await fetch(`${API_URL}/expenses`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }

            console.log("Failed to load monthly expenses");
            return;
        }

        const expenses = await response.json();

        const today = new Date();

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let monthlyTotal = 0;

        expenses.forEach(function(expense) {
            const expenseDate =
                new Date(expense.expense_date);

            if (
                expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear
            ) {
                monthlyTotal += expense.amount;
            }
        });

        document.getElementById("this-month").textContent =
            `₹${monthlyTotal}`;

    } catch (error) {
        console.error("Load monthly total error:", error);
    }
}


async function deleteExpense(expenseId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
        return;
    }

    const response = await fetch(
        `${API_URL}/expenses/${expenseId}`,
        {
            method: "DELETE",

            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (response.status === 204) {

            showMessage(
        "Expense deleted successfully! ",
        "success"
    );

        loadExpenses();
        loadTotal();

    } else {

        const result = await response.json();

        console.log("Delete error:", result);

    }
}

async function editExpense(expenseId) {

    const response = await fetch(
        `${API_URL}/expenses/${expenseId}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        showMessage(
            "Could not find expense.",
            "error"
        );
        return;
    }

    const expense = await response.json();

    document.getElementById("edit-id").value =
        expense.id;

    document.getElementById("edit-category").value =
        expense.category;

    document.getElementById("edit-description").value =
        expense.description;

    document.getElementById("edit-amount").value =
        expense.amount;

    document.getElementById("edit-date").value =
        expense.expense_date;

    document.getElementById("edit-form").style.display =
        "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function saveEditedExpense() {

    const expenseId =
        document.getElementById("edit-id").value;

    const category =
        document.getElementById("edit-category").value;

    const description =
        document.getElementById("edit-description").value;

    const amount =
        Number(document.getElementById("edit-amount").value);

    const expenseDate =
        document.getElementById("edit-date").value;

    if (!category || !description || !expenseDate) {
        showMessage(
            "Please fill all fields.",
            "error"
        );
        return;
    }

    if (description.length < 2) {
        showMessage(
            "Description must contain at least 2 characters.",
            "error"
        );
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        showMessage(
            "Amount must be greater than 0.",
            "error"
        );
        return;
    }

    const updatedExpense = {
        category: category,
        description: description,
        amount: amount,
        expense_date: expenseDate
    };

    const response = await fetch(
        `${API_URL}/expenses/${expenseId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedExpense)
        }
    );

    if (!response.ok) {
        showMessage(
            "Failed to update expense.",
            "error"
        );
        return;
    }

    showMessage(
        "Expense updated successfully! ✅",
        "success"
    );

    document.getElementById("edit-form").style.display =
        "none";

    loadExpenses();
    loadTotal();
    loadThisMonth();
}

function logout() {

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
}
loadExpenses();
loadTotal();

let expenseChart = null;

function loadCategorySummary(expenses) {
    const summaryContainer =
        document.getElementById("category-summary");

    summaryContainer.innerHTML = "";

    const categoryTotals = {};

    expenses.forEach(function(expense) {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });

    for (const category in categoryTotals) {
        const summaryItem = document.createElement("div");

        summaryItem.className = "expense-item";

        summaryItem.innerHTML = `
            <strong>${category}</strong>
            <strong>₹${categoryTotals[category]}</strong>
        `;

        summaryContainer.appendChild(summaryItem);
    }

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    const ctx = document.getElementById("expense-chart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: labels,

            datasets: [{
                data: values
            }]
        },

        options: {
            responsive: true
        }
    });
}

document
    .getElementById("filter-category")
    .addEventListener("change", filterExpenses);

document
    .getElementById("filter-month")
    .addEventListener("change", filterExpenses);

document
    .getElementById("filter-from-date")
    .addEventListener("change", filterExpenses);

document
    .getElementById("filter-to-date")
    .addEventListener("change", filterExpenses);

document
    .getElementById("search-expense")
    .addEventListener("input", filterExpenses);

document
    .getElementById("sort-expenses")
    .addEventListener("change", filterExpenses);

document
    .getElementById("clear-filters-btn")
    .addEventListener("click", clearFilters);  

document
    .getElementById("prev-page")
    .addEventListener(
        "click",
        goToPreviousPage
    );

document
    .getElementById("next-page")
    .addEventListener(
        "click",
        goToNextPage
    );

    function clearFilters() {

        currentPage = 1;

    document.getElementById("filter-category").value = "all";

    document.getElementById("filter-month").value = "";

    document.getElementById("filter-from-date").value = "";

    document.getElementById("filter-to-date").value = "";

    document.getElementById("search-expense").value = "";

    document.getElementById("sort-expenses").value = "newest";

    displayExpenses(allExpenses);
}
async function loadUser() {
    const response = await fetch(`${API_URL}/me`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.log("Failed to load user");
        return;
    }

    const user = await response.json();

    document.getElementById("user-info").textContent =
        `Welcome, ${user.name}!`;
}
loadExpenses();
loadTotal();
loadThisMonth();
loadUser();
document
    .getElementById("save-edit-btn")
    .addEventListener("click", saveEditedExpense);

document
    .getElementById("cancel-edit-btn")
    .addEventListener("click", function() {

        document.getElementById("edit-form").style.display =
            "none";
    });

    function loadStatistics(expenses) {

    const totalEntries =
        expenses.length;

    let highestExpense = 0;

    expenses.forEach(function(expense) {

        if (expense.amount > highestExpense) {
            highestExpense = expense.amount;
        }

    });

    document.getElementById("total-entries").textContent =
        totalEntries;

    document.getElementById("highest-expense").textContent =
        `₹${highestExpense}`;
}