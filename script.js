(() => {
  "use strict";

  const HISTORY_KEY = "fortify-password-history";
  const output = document.querySelector("#passwordOutput");
  const lengthInput = document.querySelector("#length");
  const lengthValue = document.querySelector("#lengthValue");
  const entropyValue = document.querySelector("#entropyValue");
  const generateButton = document.querySelector("#generateButton");
  const copyButton = document.querySelector("#copyButton");
  const toast = document.querySelector("#toast");
  const optionInputs = {
    uppercase: document.querySelector("#uppercase"),
    numbers: document.querySelector("#numbers"),
    symbols: document.querySelector("#symbols")
  };
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?";
  let toastTimer;

  function getHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : []);
    } catch (error) {
      throw new Error("Unable to read password history from this browser.", { cause: error });
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([...history]));
    } catch (error) {
      throw new Error("Unable to save password history. Please check browser storage permissions.", { cause: error });
    }
  }

  function randomIndex(max) {
    if (!window.crypto?.getRandomValues) throw new Error("Secure random generation is not available in this browser.");
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do { window.crypto.getRandomValues(values); } while (values[0] >= limit);
    return values[0] % max;
  }

  function randomCharacter(characters) {
    return characters[randomIndex(characters.length)];
  }

  function createPassword(length) {
    const selected = [lowercase];
    if (optionInputs.uppercase.checked) selected.push(uppercase);
    if (optionInputs.numbers.checked) selected.push(numbers);
    if (optionInputs.symbols.checked) selected.push(symbols);
    const allCharacters = selected.join("");
    const passwordCharacters = selected.map(randomCharacter);
    while (passwordCharacters.length < length) passwordCharacters.push(randomCharacter(allCharacters));
    for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [passwordCharacters[index], passwordCharacters[swapIndex]] = [passwordCharacters[swapIndex], passwordCharacters[index]];
    }
    return passwordCharacters.join("");
  }

  function generate() {
    const history = getHistory();
    let password;
    let attempts = 0;
    do {
      password = createPassword(Number(lengthInput.value));
      attempts += 1;
    } while (history.has(password) && attempts < 100);
    if (history.has(password)) throw new Error("Could not create a unique password. Clear local history and try again.");
    history.add(password);
    saveHistory(history);
    output.textContent = password;
    copyButton.disabled = false;
    entropyValue.textContent = `${Math.round(Number(lengthInput.value) * Math.log2([...lowercase, ...(optionInputs.uppercase.checked ? uppercase : ""), ...(optionInputs.numbers.checked ? numbers : ""), ...(optionInputs.symbols.checked ? symbols : "")].join("").length))} bits entropy`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function runGenerate() {
    try { generate(); } catch (error) { showToast(error.message); }
  }

  lengthInput.addEventListener("input", () => { lengthValue.textContent = lengthInput.value; runGenerate(); });
  Object.values(optionInputs).forEach((input) => input.addEventListener("change", runGenerate));
  generateButton.addEventListener("click", runGenerate);
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      showToast("Password copied to clipboard");
    } catch (error) {
      showToast("Could not copy password. Please copy it manually.");
    }
  });
  runGenerate();
})();
