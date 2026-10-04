// AlphaLogix TMS v3

// Cloud TMS powered by Supabase

let supabaseClient;

let currentUser = null;

let loads = [];

const DISPATCHER_RATE = 0.10;

const DRIVER_RATE = 0.60;

function money(value) {

  return new Intl.NumberFormat("en-US", {

    style: "currency",

    currency: "USD"

  }).format(Number(value || 0));

}

function number(value) {

  return Number(value || 0);

}

async function startAlphaLogix() {

  try {

    if (!window.ALPHALOGIX_CONFIG) {

      alert("AlphaLogix configuration was not found.");

      return;

    }

    supabaseClient = window.supabase.createClient(

      window.ALPHALOGIX_CONFIG.supabaseUrl,

      window.ALPHALOGIX_CONFIG.supabaseKey

    );

    const { data } = await supabaseClient.auth.getSession();

    if (data.session?.user) {

      currentUser = data.session.user;

      showApp();

      await loadCloudLoads();

    } else {

      showLogin();

    }

    supabaseClient.auth.onAuthStateChange(

      async (event, session) => {

        if (session?.user) {

          currentUser = session.user;

          showApp();

          await loadCloudLoads();

        } else {

          currentUser = null;

          loads = [];

          showLogin();

        }

      }

    );

  } catch (error) {

    console.error(error);

    alert("AlphaLogix startup error: " + error.message);

  }

}

function showLogin() {

  document.getElementById("loginScreen")?.classList.remove("hidden");

  document.getElementById("appScreen")?.classList.add("hidden");

}

function showApp() {

  document.getElementById("loginScreen")?.classList.add("hidden");

  document.getElementById("appScreen")?.classList.remove("hidden");

  const email = document.getElementById("userEmail");

  if (email && currentUser) {

    email.textContent = currentUser.email;

  }

}

async function createAccount() {

  const email =

    document.getElementById("email")?.value.trim();

  const password =

    document.getElementById("password")?.value;

  if (!email || !password) {

    alert("Enter your email and password.");

    return;

  }

  if (password.length < 8) {

    alert("Password must contain at least 8 characters.");

    return;

  }

  const { data, error } =

    await supabaseClient.auth.signUp({

      email,

      password

    });

  if (error) {

    alert(error.message);

    return;

  }

  if (!data.session) {

    alert(

      "Account created. Check your email and confirm your account."

    );

  }

}

async function signIn() {

  const email =

    document.getElementById("email")?.value.trim();

  const password =

    document.getElementById("password")?.value;

  if (!email || !password) {

    alert("Enter your email and password.");

    return;

  }

  const { error } =

    await supabaseClient.auth.signInWithPassword({

      email,

      password

    });

  if (error) {

    alert(error.message);

  }

}

async function signOut() {

  await supabaseClient.auth.signOut();

}

async function loadCloudLoads() {

  if (!currentUser) return;

  const { data, error } =

    await supabaseClient

      .from("loads")

      .select("*")

      .order("load_date", {

        ascending: false

      });

  if (error) {

    console.error(error);

    alert("Unable to load AlphaLogix loads.");

    return;

  }

  loads = data || [];

  renderLoads();

  updateDashboard();

}

function calculateLoad(load) {

  const loadedMiles =

    number(load.loaded_miles);

  const deadheadMiles =

    number(load.deadhead_miles);

  const totalMiles =

    loadedMiles + deadheadMiles;

  const gross =

    number(load.gross_amount);

  const dispatcherPay =

    gross * DISPATCHER_RATE;

  const driverPay =

    totalMiles * DRIVER_RATE;

  let fuelCost = 0;

  const mpg =

    number(load.mpg_override);

  const fuelPrice =

    number(load.fuel_price_override);

  if (mpg > 0 && fuelPrice > 0) {

    fuelCost =

      (totalMiles / mpg) * fuelPrice;

  }

  const tolls =

    number(load.tolls);

  const other =

    number(load.other_expenses);

  const net =

    gross -

    dispatcherPay -

    driverPay -

    fuelCost -

    tolls -

    other;

  const revenuePerMile =

    totalMiles > 0

      ? gross / totalMiles

      : 0;

  const netPerMile =

    totalMiles > 0

      ? net / totalMiles

      : 0;

  const margin =

    gross > 0

      ? (net / gross) * 100

      : 0;

  return {

    totalMiles,

    dispatcherPay,

    driverPay,

    fuelCost,

    net,

    revenuePerMile,

    netPerMile,

    margin

  };

}

async function saveLoad() {

  if (!currentUser) {

    alert("You must be signed in.");

    return;

  }

  const id =

    document.getElementById("loadId")?.value;

  const loadNumber =

    document.getElementById("loadNumber")?.value.trim();

  if (!loadNumber) {

    alert("Enter a load number.");

    return;

  }

  const load = {

    user_id: currentUser.id,

    load_number: loadNumber,

    load_date:

      document.getElementById("loadDate")?.value ||

      new Date().toISOString().slice(0, 10),

    status:

      document.getElementById("loadStatus")?.value ||

      "Booked",

    broker_customer:

      document.getElementById("broker")?.value.trim() || "",

    origin:

      document.getElementById("origin")?.value.trim() || "",

    destination:

      document.getElementById("destination")?.value.trim() || "",

    truck:

      document.getElementById("truck")?.value.trim() || "",

    loaded_miles:

      number(

        document.getElementById("loadedMiles")?.value

      ),

    deadhead_miles:

      number(

        document.getElementById("deadheadMiles")?.value

      ),

    gross_amount:

      number(

        document.getElementById("grossAmount")?.value

      ),

    tolls:

      number(

        document.getElementById("tolls")?.value

      ),

    other_expenses:

      number(

        document.getElementById("otherExpenses")?.value

      ),

    mpg_override:

      document.getElementById("mpg")?.value

        ? number(document.getElementById("mpg").value)

        : null,

    fuel_price_override:

      document.getElementById("fuelPrice")?.value

        ? number(

            document.getElementById("fuelPrice").value

          )

        : null,

    notes:

      document.getElementById("notes")?.value.trim() || "",

    updated_at:

      new Date().toISOString()

  };

  let result;

  if (id) {

    result =

      await supabaseClient

        .from("loads")

        .update(load)

        .eq("id", id);

  } else {

    result =

      await supabaseClient

        .from("loads")

        .insert(load);

  }

  if (result.error) {

    console.error(result.error);

    alert(

      "Load could not be saved: " +

      result.error.message

    );

    return;

  }

  closeLoadForm();

  await loadCloudLoads();

}

function newLoad() {

  document.getElementById("loadId").value = "";

  document.getElementById("loadNumber").value = "";

  document.getElementById("loadDate").value =

    new Date().toISOString().slice(0, 10);

  document.getElementById("loadStatus").value =

    "Booked";

  document.getElementById("broker").value = "";

  document.getElementById("origin").value = "";

  document.getElementById("destination").value = "";

  document.getElementById("truck").value = "";

  document.getElementById("loadedMiles").value = "";

  document.getElementById("deadheadMiles").value = "";

  document.getElementById("grossAmount").value = "";

  document.getElementById("tolls").value = "";

  document.getElementById("otherExpenses").value = "";

  document.getElementById("mpg").value = "";

  document.getElementById("fuelPrice").value = "";

  document.getElementById("notes").value = "";

  document

    .getElementById("loadForm")

    .classList.remove("hidden");

}

function editLoad(id) {

  const load =

    loads.find(item => item.id === id);

  if (!load) return;

  document.getElementById("loadId").value =

    load.id;

  document.getElementById("loadNumber").value =

    load.load_number || "";

  document.getElementById("loadDate").value =

    load.load_date || "";

  document.getElementById("loadStatus").value =

    load.status || "Booked";

  document.getElementById("broker").value =

    load.broker_customer || "";

  document.getElementById("origin").value =

    load.origin || "";

  document.getElementById("destination").value =

    load.destination || "";

  document.getElementById("truck").value =

    load.truck || "";

  document.getElementById("loadedMiles").value =

    load.loaded_miles || "";

  document.getElementById("deadheadMiles").value =

    load.deadhead_miles || "";

  document.getElementById("grossAmount").value =

    load.gross_amount || "";

  document.getElementById("tolls").value =

    load.tolls || "";

  document.getElementById("otherExpenses").value =

    load.other_expenses || "";

  document.getElementById("mpg").value =

    load.mpg_override || "";

  document.getElementById("fuelPrice").value =

    load.fuel_price_override || "";

  document.getElementById("notes").value =

    load.notes || "";

  document

    .getElementById("loadForm")

    .classList.remove("hidden");

}

function closeLoadForm() {

  document

    .getElementById("loadForm")

    ?.classList.add("hidden");

}

async function deleteLoad(id) {

  if (!confirm("Delete this load?")) {

    return;

  }

  const { error } =

    await supabaseClient

      .from("loads")

      .delete()

      .eq("id", id);

  if (error) {

    alert(error.message);

    return;

  }

  await loadCloudLoads();

}

function renderLoads() {

  const body =

    document.getElementById("loadsBody");

  if (!body) return;

  if (!loads.length) {

    body.innerHTML =

      `<tr>

        <td colspan="10">

          No loads saved yet.

        </td>

      </tr>`;

    return;

  }

  body.innerHTML =

    loads.map(load => {

      const calc =

        calculateLoad(load);

      return `

        <tr>

          <td>

            <strong>${load.load_number}</strong>

          </td>

          <td>

            ${load.load_date || ""}

          </td>

          <td>

            ${load.broker_customer || ""}

          </td>

          <td>

            ${load.origin || ""}

            →

            ${load.destination || ""}

          </td>

          <td>

            ${load.status || ""}

          </td>

          <td>

            ${calc.totalMiles.toLocaleString()}

          </td>

          <td>

            ${money(load.gross_amount)}

          </td>

          <td>

            ${money(calc.dispatcherPay)}

          </td>

          <td>

            ${money(calc.driverPay)}

          </td>

          <td>

            <strong>${money(calc.net)}</strong>

            <br>

            ${calc.margin.toFixed(1)}%

          </td>

          <td>

            <button

              onclick="editLoad('${load.id}')">

              Edit

            </button>

            <button

              onclick="deleteLoad('${load.id}')">

              Delete

            </button>

          </td>

        </tr>

      `;

    }).join("");

}

function updateDashboard() {

  let gross = 0;

  let dispatcher = 0;

  let driver = 0;

  let net = 0;

  let miles = 0;

  loads.forEach(load => {

    const calc =

      calculateLoad(load);

    gross +=

      number(load.gross_amount);

    dispatcher +=

      calc.dispatcherPay;

    driver +=

      calc.driverPay;

    net +=

      calc.net;

    miles +=

      calc.totalMiles;

  });

  const grossElement =

    document.getElementById("totalGross");

  const dispatcherElement =

    document.getElementById("totalDispatcher");

  const driverElement =

    document.getElementById("totalDriver");

  const netElement =

    document.getElementById("totalNet");

  const milesElement =

    document.getElementById("totalMiles");

  if (grossElement)

    grossElement.textContent =

      money(gross);

  if (dispatcherElement)

    dispatcherElement.textContent =

      money(dispatcher);

  if (driverElement)

    driverElement.textContent =

      money(driver);

  if (netElement)

    netElement.textContent =

      money(net);

  if (milesElement)

    milesElement.textContent =

      Math.round(miles).toLocaleString();

}

document.addEventListener(

  "DOMContentLoaded",

  startAlphaLogix

);
