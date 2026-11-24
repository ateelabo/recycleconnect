
const currentPage = window.location.pathname.split("/").pop();

const navigationItems = [
  {
    label: "Home",
    file: "household-dashboard.html",
    icon: "home"
  },
  {
    label: "History",
    file: "balance-history.html",
    icon: "history"
  },
  {
    label: "Rewards",
    file: "rewards.html",
    icon: "gift"
  },
  {
    label: "Profile",
    file: "profile-settings.html",
    icon: "user"
  }
];

const icons = {
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5m4-2v5l3 2"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8H7a2.5 2.5 0 1 1 2.5-2.5C9.5 7 12 8 12 8Zm0 0h5a2.5 2.5 0 1 0-2.5-2.5C14.5 7 12 8 12 8Z"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/>'
};

export function renderBottomNavigation() {
  const navigation = document.getElementById("bottom-navigation");

  if (!navigation) return;

  navigation.innerHTML = navigationItems.map(item => {
    const active = currentPage === item.file;

    return `
      <a href="./${item.file}"
         class="group flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:bg-green-50 hover:text-green-700 ${
  active
    ? "text-green-700 font-semibold bg-green-50"
    : "text-slate-400"
}">
        <svg class="h-5 w-5" viewBox="0 0 24 24"
             fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round"
             stroke-linejoin="round">
          ${icons[item.icon]}
        </svg>
        <span class="text-[10px]">${item.label}</span>
      </a>
    `;
  }).join("");
}
