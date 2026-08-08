(function () {
  const GOAL_KEY = 'calorieTracker.goal';
  const entriesKey = (date) => `calorieTracker.entries.${date}`;

  const datePicker = document.getElementById('date-picker');
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');
  const goalInput = document.getElementById('goal-input');
  const progressFill = document.getElementById('progress-fill');
  const consumedTotalEl = document.getElementById('consumed-total');
  const remainingTotalEl = document.getElementById('remaining-total');
  const entryForm = document.getElementById('entry-form');
  const foodNameInput = document.getElementById('food-name');
  const foodCaloriesInput = document.getElementById('food-calories');
  const foodMealSelect = document.getElementById('food-meal');
  const mealGroups = document.querySelectorAll('.meal-group');

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  let currentDate = toDateStr(new Date());

  function loadGoal() {
    const stored = localStorage.getItem(GOAL_KEY);
    return stored ? Number(stored) : null;
  }

  function saveGoal(value) {
    localStorage.setItem(GOAL_KEY, String(value));
  }

  function loadEntries(date) {
    const stored = localStorage.getItem(entriesKey(date));
    return stored ? JSON.parse(stored) : [];
  }

  function saveEntries(date, entries) {
    localStorage.setItem(entriesKey(date), JSON.stringify(entries));
  }

  function render() {
    datePicker.value = currentDate;
    const goal = loadGoal();
    goalInput.value = goal ?? '';

    const entries = loadEntries(currentDate);

    mealGroups.forEach((group) => {
      const meal = group.dataset.meal;
      const list = group.querySelector('.entry-list');
      const totalEl = group.querySelector('.meal-total');
      const mealEntries = entries.filter((e) => e.meal === meal);

      list.innerHTML = '';
      if (mealEntries.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'entry-empty';
        empty.textContent = 'No entries yet';
        list.appendChild(empty);
      } else {
        mealEntries.forEach((entry) => {
          const li = document.createElement('li');

          const name = document.createElement('span');
          name.className = 'entry-name';
          name.textContent = entry.name;

          const cals = document.createElement('span');
          cals.className = 'entry-calories';
          cals.textContent = `${entry.calories} kcal`;

          const del = document.createElement('button');
          del.className = 'entry-delete';
          del.textContent = '✕';
          del.setAttribute('aria-label', `Delete ${entry.name}`);
          del.addEventListener('click', () => deleteEntry(entry.id));

          li.appendChild(name);
          li.appendChild(cals);
          li.appendChild(del);
          list.appendChild(li);
        });
      }

      const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
      totalEl.textContent = `${mealTotal} kcal`;
    });

    const consumed = entries.reduce((sum, e) => sum + e.calories, 0);
    consumedTotalEl.textContent = `${consumed} kcal`;

    if (goal) {
      const remaining = goal - consumed;
      remainingTotalEl.textContent = `${remaining} kcal`;
      const pct = Math.min(100, (consumed / goal) * 100);
      progressFill.style.width = `${pct}%`;
      progressFill.classList.toggle('over', consumed > goal);
    } else {
      remainingTotalEl.textContent = 'set a goal';
      progressFill.style.width = '0%';
      progressFill.classList.remove('over');
    }
  }

  function deleteEntry(id) {
    const entries = loadEntries(currentDate).filter((e) => e.id !== id);
    saveEntries(currentDate, entries);
    render();
  }

  function addEntry(name, calories, meal) {
    const entries = loadEntries(currentDate);
    entries.push({ id: crypto.randomUUID(), name, calories, meal });
    saveEntries(currentDate, entries);
    render();
  }

  function shiftDate(days) {
    const d = new Date(`${currentDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    currentDate = toDateStr(d);
    render();
  }

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = foodNameInput.value.trim();
    const calories = Number(foodCaloriesInput.value);
    const meal = foodMealSelect.value;
    if (!name || !Number.isFinite(calories) || calories < 0) return;

    addEntry(name, calories, meal);
    entryForm.reset();
    foodNameInput.focus();
  });

  goalInput.addEventListener('change', () => {
    const value = Number(goalInput.value);
    if (Number.isFinite(value) && value >= 0) {
      saveGoal(value);
      render();
    }
  });

  datePicker.addEventListener('change', () => {
    currentDate = datePicker.value || toDateStr(new Date());
    render();
  });

  prevDayBtn.addEventListener('click', () => shiftDate(-1));
  nextDayBtn.addEventListener('click', () => shiftDate(1));

  render();
})();
