
    const display = document.getElementById('display');

    function append(val) {
      display.value += val;
    }

    function clearDisplay() {
      display.value = '';
    }

    function backspace() {
      display.value = display.value.slice(0, -1);
    }

    function calculate() {
      try {
        display.value = eval(display.value);
      } catch {
        display.value = 'Error';
      }
    }

    function toggleTheme() {
      document.body.classList.toggle('dark');
    }
 