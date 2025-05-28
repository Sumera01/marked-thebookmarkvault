const storage = {
    getCategories: () => JSON.parse(localStorage.getItem('categories')) || [],
    getBookmarks: () => JSON.parse(localStorage.getItem('bookmarks')) || [],
    saveCategories: categories => localStorage.setItem('categories', JSON.stringify(categories)),
    saveBookmarks: bookmarks => localStorage.setItem('bookmarks', JSON.stringify(bookmarks)),
    getTheme: () => localStorage.getItem('theme') || 'white',
    saveTheme: theme => localStorage.setItem('theme', theme)
};

const elements = {
    loader: document.getElementById('loader'),
    mainContent: document.getElementById('main-content'),
    categoryList: document.getElementById('categoryList'),
    categoryBar: document.getElementById('categoryBar'),
    bookmarkList: document.getElementById('bookmarkList'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    addBookmarkBtn: document.getElementById('addBookmarkBtn'),
    modal: document.getElementById('modal'),
    bookmarkForm: document.getElementById('bookmarkForm'),
    modalTitle: document.getElementById('modalTitle').querySelector('span'),
    bookmarkName: document.getElementById('bookmarkName'),
    bookmarkUrl: document.getElementById('bookmarkUrl'),
    bookmarkCategory: document.getElementById('bookmarkCategory'),
    urlInput: document.getElementById('urlInput'),
    categorySelect: document.getElementById('categorySelect'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn'),
    currentCategory: document.getElementById('currentCategory'),
    searchBar: document.getElementById('searchBar'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    confirmModal: document.getElementById('confirmModal'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmCancel: document.getElementById('confirmCancel'),
    confirmDelete: document.getElementById('confirmDelete'),
    urlError: document.getElementById('urlError'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    linkCircle: document.getElementById('linkCircle'),
    linkOverlay: document.getElementById('linkOverlay'),
    linkOverlayClose: document.getElementById('linkOverlayClose')
};

let editingBookmarkId = null;
let selectedCategory = null;
let deleteCallback = null;
let previousBookmarks = storage.getBookmarks();

function setTheme(theme) {
    document.body.classList.toggle('white', theme === 'white');
    document.body.classList.toggle('dark', theme !== 'white');
    storage.saveTheme(theme);
    elements.themeIcon.innerHTML = theme === 'white'
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function validateUrl(url) {
    if (!url) return '';
    if (!url.match(/^https?:\/\//)) url = 'https://' + url;
    try {
        new URL(url);
        return url;
    } catch {
        return false;
    }
}

function showLoader() {
    elements.loader.style.display = 'flex';
    setTimeout(() => {
        elements.loader.style.display = 'none';
        elements.mainContent.classList.remove('hidden');
        elements.mainContent.style.opacity = '1';
    }, 1000);
}

function renderCategories() {
    const categories = storage.getCategories();
    elements.categoryList.innerHTML = `
        <li class="cursor-pointer p-2 rounded hover:bg-secondary flex justify-between items-center ${!selectedCategory ? 'bg-secondary' : ''}" data-id="all">
            <span class="flex items-center text-theme">
                <svg class="icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                All Bookmarks
            </span>
            <span class="text-xs bg-secondary px-1 py-0.5 rounded text-theme">${storage.getBookmarks().length}</span>
        </li>`;
    categories.forEach(category => {
        const bookmarkCount = storage.getBookmarks().filter(b => b.category === category.id).length;
        elements.categoryList.innerHTML += `
            <li class="cursor-pointer p-2 rounded hover:bg-secondary flex justify-between items-center ${selectedCategory === category.id ? 'bg-secondary' : ''}" data-id="${category.id}">
                <span class="flex items-center text-theme">
                    <span class="w-2 h-2 rounded-full mr-2 bg-gray-500"></span>
                    ${category.name}
                </span>
                <div class="flex items-center gap-1">
                    <span class="text-xs bg-secondary px-1 py-0.5 rounded text-theme">${bookmarkCount}</span>
                    <button class="text-red-500 hover:text-red-700 delete-category" data-id="${category.id}" aria-label="Delete category">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </li>`;
    });

    elements.categoryBar.innerHTML = `
        <button class="category-btn ${!selectedCategory ? 'active' : ''}" data-id="all">
            All (${storage.getBookmarks().length})
        </button>`;
    categories.forEach(category => {
        const bookmarkCount = storage.getBookmarks().filter(b => b.category === category.id).length;
        elements.categoryBar.innerHTML += `
            <button class="category-btn ${selectedCategory === category.id ? 'active' : ''}" data-id="${category.id}">
                <span class="flex items-center">
                    <span class="w-2 h-2 rounded-full mr-2 bg-gray-500"></span>
                    ${category.name} (${bookmarkCount})
                </span>
            </button>`;
    });

    elements.bookmarkCategory.innerHTML = '<option value="">No Category</option>';
    categories.forEach(category => {
        elements.bookmarkCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
    });
}

function renderBookmarks(searchTerm = '') {
    const bookmarks = storage.getBookmarks();
    const theme = storage.getTheme();
    const faviconColor = theme === 'white' ? '#000000' : '#ffffff';
    const addedBookmarks = bookmarks.filter(b => !previousBookmarks.some(pb => pb.id === b.id));
    const addedBookmarkIds = new Set(addedBookmarks.map(b => b.id));

    elements.bookmarkList.innerHTML = '';
    const filteredBookmarks = selectedCategory
        ? bookmarks.filter(b => b.category === selectedCategory)
        : bookmarks;
    const searchedBookmarks = searchTerm
        ? filteredBookmarks.filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.url.toLowerCase().includes(searchTerm.toLowerCase()))
        : filteredBookmarks;

    searchedBookmarks.forEach(bookmark => {
        const favicon = bookmark.url ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(bookmark.url)}` : '';
        const animationClass = addedBookmarkIds.has(bookmark.id) ? 'emerge' : '';
        elements.bookmarkList.innerHTML += `
            <div class="bookmark-item card border border-theme p-3 rounded bg-theme ${animationClass}" draggable="true" data-id="${bookmark.id}" role="listitem">
                <div class="flex items-center gap-2">
                    ${bookmark.url ? `<img src="${favicon}" alt="" class="w-5 h-5" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"${encodeURIComponent(faviconColor)}\" d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z\"/%3E%3C/svg%3E';">` : ''}
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-theme truncate">
                            ${bookmark.url ? `<a href="${bookmark.url}" target="_blank" class="text-blue-600 hover:underline">${bookmark.name}</a>` : bookmark.name}
                        </h3>
                    </div>
                </div>
                <div class="bookmark-actions">
                    <button class="edit-bookmark text-theme" data-id="${bookmark.id}" aria-label="Edit bookmark">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                    </button>
                    <button class="delete-bookmark text-theme" data-id="${bookmark.id}" aria-label="Delete bookmark">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4"/>
                        </svg>
                    </button>
                </div>
            </div>`;
    });

    previousBookmarks = [...bookmarks];
    setupDragAndDrop();
}

function showModal(title, bookmark = {}) {
    elements.modal.classList.remove('hidden');
    elements.modalTitle.textContent = title;
    elements.bookmarkName.value = bookmark.name || '';
    elements.bookmarkUrl.value = bookmark.url || '';
    elements.bookmarkCategory.value = bookmark.category || '';
    elements.urlInput.classList.toggle('hidden', title === 'Add Category');
    elements.categorySelect.classList.toggle('hidden', title === 'Add Category');
    elements.bookmarkName.focus();
}

function hideModal() {
    elements.modal.classList.add('hidden');
    elements.bookmarkForm.reset();
    elements.urlError.classList.add('hidden');
    editingBookmarkId = null;
}

function showConfirmModal(message, callback) {
    elements.confirmMessage.textContent = message;
    elements.confirmModal.classList.remove('hidden');
    deleteCallback = callback;
}

function hideConfirmModal() {
    elements.confirmModal.classList.add('hidden');
    deleteCallback = null;
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => draggable.classList.add('opacity-50'));
        draggable.addEventListener('dragend', () => draggable.classList.remove('opacity-50'));
    });

    elements.bookmarkList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(elements.bookmarkList, e.clientY);
        const draggable = document.querySelector('.opacity-50');
        if (afterElement == null) {
            elements.bookmarkList.appendChild(draggable);
        } else {
            elements.bookmarkList.insertBefore(draggable, afterElement);
        }
    });

    elements.bookmarkList.addEventListener('drop', e => {
        e.preventDefault();
        const draggable = document.querySelector('.opacity-50');
        const bookmarkId = draggable.dataset.id;
        let bookmarks = storage.getBookmarks();
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        const index = Array.from(elements.bookmarkList.children).indexOf(draggable);
        bookmarks.splice(index, 0, bookmark);
        storage.saveBookmarks(bookmarks);
        renderBookmarks(elements.searchBar.value);
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.opacity-50)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function exportBookmarks() {
    const data = { categories: storage.getCategories(), bookmarks: storage.getBookmarks() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmark-manager.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importBookmarks(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            let categories = storage.getCategories();
            let bookmarks = storage.getBookmarks();
            if (data.categories) {
                categories = [...categories, ...data.categories.filter(c => !categories.some(ec => ec.id === c.id))];
                storage.saveCategories(categories);
            }
            if (data.bookmarks) {
                bookmarks = [...bookmarks, ...data.bookmarks.filter(b => !bookmarks.some(eb => eb.id === b.id))];
                storage.saveBookmarks(bookmarks);
            }
            renderCategories();
            renderBookmarks();
            alert('Bookmarks and categories imported successfully!');
        } catch {
            alert('Error importing bookmarks: Invalid file format');
        }
    };
    reader.readAsText(file);
}

elements.addCategoryBtn.addEventListener('click', () => showModal('Add Category'));
elements.addBookmarkBtn.addEventListener('click', () => showModal('Add Bookmark'));
elements.cancelBtn.addEventListener('click', hideModal);

elements.bookmarkForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = elements.modalTitle.textContent;
    if (title === 'Add Category') {
        const categoryName = elements.bookmarkName.value.trim();
        if (!categoryName) return;
        const categories = storage.getCategories();
        storage.saveCategories([...categories, { id: Date.now().toString(), name: categoryName }]);
        renderCategories();
        hideModal();
    } else {
        let url = elements.bookmarkUrl.value.trim();
        if (url && !validateUrl(url)) {
            elements.urlError.classList.remove('hidden');
            return;
        }
        elements.urlError.classList.add('hidden');
        url = validateUrl(url);
        const bookmark = {
            id: editingBookmarkId || Date.now().toString(),
            name: elements.bookmarkName.value.trim(),
            url,
            category: elements.bookmarkCategory.value
        };
        const bookmarks = storage.getBookmarks();
        if (editingBookmarkId) {
            const index = bookmarks.findIndex(b => b.id === editingBookmarkId);
            bookmarks[index] = bookmark;
        } else {
            bookmarks.push(bookmark);
        }
        storage.saveBookmarks(bookmarks);
        renderBookmarks();
        hideModal();
    }
});

elements.categoryList.addEventListener('click', e => {
    const item = e.target.closest('li');
    const deleteBtn = e.target.closest('.delete-category');
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showConfirmModal('Are you sure you want to delete this category and its bookmarks?', () => {
            let categories = storage.getCategories().filter(c => c.id !== id);
            storage.saveCategories(categories);
            let bookmarks = storage.getBookmarks().filter(b => b.category !== id);
            storage.saveBookmarks(bookmarks);
            if (selectedCategory === id) {
                selectedCategory = null;
                elements.currentCategory.textContent = 'All Bookmarks';
            }
            renderCategories();
            renderBookmarks();
        });
    } else if (item) {
        selectedCategory = item.dataset.id === 'all' ? null : item.dataset.id;
        elements.currentCategory.textContent = selectedCategory
            ? storage.getCategories().find(c => c.id === selectedCategory).name
            : 'All Bookmarks';
        renderCategories();
        renderBookmarks();
    }
});

elements.categoryBar.addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (btn) {
        selectedCategory = btn.dataset.id === 'all' ? null : btn.dataset.id;
        elements.currentCategory.textContent = selectedCategory
            ? storage.getCategories().find(c => c.id === selectedCategory).name
            : 'All Bookmarks';
        renderCategories();
        renderBookmarks();
    }
});

elements.bookmarkList.addEventListener('click', e => {
    const editBtn = e.target.closest('.edit-bookmark');
    const deleteBtn = e.target.closest('.delete-bookmark');
    if (editBtn) {
        editingBookmarkId = editBtn.dataset.id;
        const bookmark = storage.getBookmarks().find(b => b.id === editingBookmarkId);
        showModal('Edit Bookmark', bookmark);
    } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showConfirmModal('Are you sure you want to delete this bookmark?', () => {
            const bookmarkItem = elements.bookmarkList.querySelector(`[data-id="${id}"]`);
            bookmarkItem.classList.add('dissolve');
            setTimeout(() => {
                const bookmarks = storage.getBookmarks().filter(b => b.id !== id);
                storage.saveBookmarks(bookmarks);
                renderBookmarks();
            }, 200);
        });
    }
});

elements.confirmCancel.addEventListener('click', hideConfirmModal);
elements.confirmDelete.addEventListener('click', () => {
    if (deleteCallback) deleteCallback();
    hideConfirmModal();
});

elements.importBtn.addEventListener('click', () => elements.importInput.click());
elements.importInput.addEventListener('change', importBookmarks);
elements.exportBtn.addEventListener('click', exportBookmarks);
elements.themeToggle.addEventListener('click', () => {
    setTheme(storage.getTheme() === 'white' ? 'dark' : 'white');
    renderBookmarks(elements.searchBar.value);
});

elements.linkCircle.addEventListener('click', () => elements.linkOverlay.classList.remove('hidden'));
elements.linkOverlayClose.addEventListener('click', () => elements.linkOverlay.classList.add('hidden'));
elements.linkOverlay.addEventListener('click', e => {
    if (e.target === elements.linkOverlay) elements.linkOverlay.classList.add('hidden');
});

const debouncedSearch = debounce(() => renderBookmarks(elements.searchBar.value), 200);
elements.searchBar.addEventListener('input', debouncedSearch);

setTheme(storage.getTheme());
showLoader();
renderCategories();
renderBookmarks();
