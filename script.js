
        // LocalStorage handling
    const storage = {
        getCategories() {
            return JSON.parse(localStorage.getItem('categories')) || [];
        },
        getBookmarks() {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        },
        saveCategories(categories) {
            localStorage.setItem('categories', JSON.stringify(categories));
        },
        saveBookmarks(bookmarks) {
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        },
        getTheme() {
            return localStorage.getItem('theme') || 'white';
        },
        saveTheme(theme) {
            localStorage.setItem('theme', theme);
        }
    };

        // DOM elements
        const loader = document.getElementById('loader');
        const mainContent = document.getElementById('main-content');
        const categoryList = document.getElementById('categoryList');
        const categoryBar = document.getElementById('categoryBar');
        const bookmarkList = document.getElementById('bookmarkList');
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const addBookmarkBtn = document.getElementById('addBookmarkBtn');
        const modal = document.getElementById('modal');
        const bookmarkForm = document.getElementById('bookmarkForm');
        const modalTitle = document.getElementById('modalTitle').querySelector('span');
        const bookmarkName = document.getElementById('bookmarkName');
        const bookmarkUrl = document.getElementById('bookmarkUrl');
        const bookmarkCategory = document.getElementById('bookmarkCategory');
        const urlInput = document.getElementById('urlInput');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');
        const currentCategory = document.getElementById('currentCategory');
        const categorySelect = document.getElementById('categorySelect');
        const searchBar = document.getElementById('searchBar');
        const importBtn = document.getElementById('importBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importInput = document.getElementById('importInput');
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmDelete = document.getElementById('confirmDelete');
        const urlError = document.getElementById('urlError');
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const linkCircle = document.getElementById('linkCircle');
        const linkOverlay = document.getElementById('linkOverlay');
        const linkOverlayClose = document.getElementById('linkOverlayClose');

        let editingBookmarkId = null;
        let selectedCategory = null;
        let deleteCallback = null;

        // Theme handling
        function setTheme(theme) {
            document.body.classList.remove('white', 'dark');
            document.body.classList.add(theme);
            storage.saveTheme(theme);
            themeIcon.innerHTML = theme === 'white'
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
        }

        // Initialize theme
        setTheme(storage.getTheme());

        // Utility functions
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        function validateUrl(url) {
            if (!url) return false;
            if (!url.match(/^https?:\/\//)) url = 'https://' + url;
            try {
                new URL(url);
                return url;
            } catch {
                return false;
            }
        }

        // Track previous bookmarks to detect additions
        let previousBookmarks = storage.getBookmarks();

        // Loader handling
        function showLoader() {
            try {
                loader.style.display = 'flex';
                mainContent.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    mainContent.style.display = 'block';
                    mainContent.style.opacity = '1';
                    mainContent.classList.add('loaded');
                }, 3000); // Hide after 3 seconds

                // Fallback timeout
                setTimeout(() => {
                    if (loader.style.display !== 'none') {
                        loader.style.display = 'none';
                        mainContent.style.display = 'block';
                        mainContent.style.opacity = '1';
                        mainContent.classList.add('loaded');
                    }
                }, 5000); // Fallback after 5 seconds
            } catch (error) {
                console.error('Error in showLoader:', error);
                loader.style.display = 'none';
                mainContent.style.display = 'block';
                mainContent.style.opacity = '1';
                mainContent.classList.add('loaded');
            }
        }

        // Render functions
        function renderCategories() {
            const categories = storage.getCategories();

            // Render sidebar (desktop)
            categoryList.innerHTML = `
                <li class="category-item cursor-pointer p-2 rounded hover:bg-secondary flex justify-between items-center ${!selectedCategory ? 'bg-secondary' : ''}" data-id="all">
                    <span class="flex items-center text-theme">
                        <svg class="icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        All Bookmarks
                    </span>
                    <span class="text-xs bg-secondary px-2 py-1 rounded text-theme">${storage.getBookmarks().length}</span>
                </li>`;

            categories.forEach(category => {
                const bookmarkCount = storage.getBookmarks().filter(b => b.category === category.id).length;
                categoryList.innerHTML += `
                    <li class="category-item cursor-pointer p-2 rounded hover:bg-secondary flex justify-between items-center ${selectedCategory === category.id ? 'bg-secondary' : ''}" data-id="${category.id}">
                        <span class="flex items-center text-theme">
                            <span class="w-3 h-3 rounded-full mr-2" style="background-color: #808080"></span>
                            ${category.name}
                        </span>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs bg-secondary px-2 py-1 rounded text-theme">${bookmarkCount}</span>
                            <button class="text-red-500 hover:text-red-700 delete-category" data-id="${category.id}" aria-label="Delete category">
                                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </li>`;
            });

            // Render category bar (mobile)
            categoryBar.innerHTML = `
                <button class="category-btn ${!selectedCategory ? 'active' : ''}" data-id="all">
                    All (${storage.getBookmarks().length})
                </button>`;

            categories.forEach(category => {
                const bookmarkCount = storage.getBookmarks().filter(b => b.category === category.id).length;
                categoryBar.innerHTML += `
                    <button class="category-btn ${selectedCategory === category.id ? 'active' : ''}" data-id="${category.id}">
                        <span class="flex items-center">
                            <span class="w-3 h-3 rounded-full mr-2" style="background-color: #808080"></span>
                            ${category.name} (${bookmarkCount})
                        </span>
                    </button>`;
            });

            updateCategoryDropdown();
        }

        function renderBookmarks(searchTerm = '') {
            const bookmarks = storage.getBookmarks();
            const theme = storage.getTheme();
            const faviconColor = theme === 'white' ? '#000000' : '#ffffff';

            // Detect added bookmarks by comparing with previous state
            const addedBookmarks = bookmarks.filter(b => !previousBookmarks.some(pb => pb.id === b.id));
            const addedBookmarkIds = new Set(addedBookmarks.map(b => b.id));

            bookmarkList.innerHTML = '';
            const filteredBookmarks = selectedCategory
                ? bookmarks.filter(b => b.category === selectedCategory)
                : bookmarks;

            const searchedBookmarks = searchTerm
                ? filteredBookmarks.filter(b =>
                    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.url.toLowerCase().includes(searchTerm.toLowerCase()))
                : filteredBookmarks;

            searchedBookmarks.forEach(bookmark => {
                const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(bookmark.url)}`;
                const animationClass = addedBookmarkIds.has(bookmark.id) ? 'emerge' : 'slideIn';
                bookmarkList.innerHTML += `
                    <div class="bookmark-item card border border-theme p-4 rounded bg-theme draggable ${animationClass}" draggable="true" data-id="${bookmark.id}" role="listitem">
                        <div class="flex items-center space-x-3">
                            <img src="${favicon}" alt="" class="w-6 h-6" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"${encodeURIComponent(faviconColor)}\" d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z\"/%3E%3C/svg%3E';">
                            <div>
                                <h3 class="font-semibold text-theme">
                                    <a href="${bookmark.url}" target="_blank" class="text-blue-600 hover:underline">${bookmark.name}</a>
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

            // Update previous bookmarks for the next render
            previousBookmarks = [...bookmarks];

            setupDragAndDrop();
        }

        function updateCategoryDropdown() {
            const categories = storage.getCategories();
            bookmarkCategory.innerHTML = '<option value="">No Category</option>';
            categories.forEach(category => {
                bookmarkCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }

        // Modal handling
        function showModal(title, bookmark = {}) {
            modal.classList.remove('hidden');
            modalTitle.textContent = title;
            bookmarkName.value = bookmark.name || '';
            bookmarkUrl.value = bookmark.url || '';
            bookmarkCategory.value = bookmark.category || '';
            urlInput.classList.toggle('hidden', title === 'Add Category');
            categorySelect.classList.toggle('hidden', title === 'Add Category');
            bookmarkName.focus();
        }

        function hideModal() {
            modal.classList.add('hidden');
            bookmarkForm.reset();
            urlError.classList.add('hidden');
            editingBookmarkId = null;
        }

        function showConfirmModal(message, callback) {
            confirmMessage.textContent = message;
            confirmModal.classList.remove('hidden');
            deleteCallback = callback;
        }

        function hideConfirmModal() {
            confirmModal.classList.add('hidden');
            deleteCallback = null;
        }

        // Drag and drop
        function setupDragAndDrop() {
            const draggables = document.querySelectorAll('.draggable');
            const containers = [bookmarkList];

            draggables.forEach(draggable => {
                draggable.addEventListener('dragstart', () => {
                    draggable.classList.add('opacity-50');
                });

                draggable.addEventListener('dragend', () => {
                    draggable.classList.remove('opacity-50');
                });
            });

            containers.forEach(container => {
                container.addEventListener('dragover', e => {
                    e.preventDefault();
                    const afterElement = getDragAfterElement(container, e.clientY);
                    const draggable = document.querySelector('.opacity-50');
                    if (afterElement == null) {
                        container.appendChild(draggable);
                    } else {
                        container.insertBefore(draggable, afterElement);
                    }
                });

                container.addEventListener('drop', e => {
                    e.preventDefault();
                    const draggable = document.querySelector('.opacity-50');
                    const bookmarkId = draggable.dataset.id;
                    let bookmarks = storage.getBookmarks();
                    const bookmark = bookmarks.find(b => b.id === bookmarkId);
                    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
                    const index = Array.from(container.children).indexOf(draggable);
                    bookmarks.splice(index, 0, bookmark);
                    storage.saveBookmarks(bookmarks);
                    renderBookmarks(searchBar.value);
                });
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.draggable:not(.opacity-50)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // Import/Export
        // Import/Export
    function exportBookmarks() {
        const data = {
            categories: storage.getCategories(),
            bookmarks: storage.getBookmarks()
        };
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

                // Get existing categories and bookmarks
                let existingCategories = storage.getCategories();
                let existingBookmarks = storage.getBookmarks();

                // Handle categories: Append new categories, avoid duplicates by id
                if (data.categories) {
                    const newCategories = data.categories.filter(
                        newCat => !existingCategories.some(existingCat => existingCat.id === newCat.id)
                    );
                    existingCategories = [...existingCategories, ...newCategories];
                    storage.saveCategories(existingCategories);
                }

                // Handle bookmarks: Append new bookmarks, avoid duplicates by id
                if (data.bookmarks) {
                    const newBookmarks = data.bookmarks.filter(
                        newBookmark => !existingBookmarks.some(existingBookmark => existingBookmark.id === newBookmark.id)
                    );
                    existingBookmarks = [...existingBookmarks, ...newBookmarks];
                    storage.saveBookmarks(existingBookmarks);
                }

                // Re-render the UI with the updated data
                renderCategories();
                renderBookmarks();
                alert('Bookmarks and categories imported successfully! New entries have been added to the existing ones.');
            } catch (error) {
                alert('Error importing bookmarks: Invalid file format');
            }
        };
        reader.readAsText(file);
    }

        // Event listeners
        addCategoryBtn.addEventListener('click', () => {
            showModal('Add Category');
        });

        addBookmarkBtn.addEventListener('click', () => {
            showModal('Add Bookmark');
        });

        cancelBtn.addEventListener('click', hideModal);

        bookmarkForm.addEventListener('submit', e => {
            e.preventDefault();
            const title = modalTitle.textContent;
            if (title === 'Add Category') {
                const categoryName = bookmarkName.value.trim();
                if (!categoryName) return;
                const categories = storage.getCategories();
                const newCategory = {
                    id: Date.now().toString(),
                    name: categoryName
                };
                storage.saveCategories([...categories, newCategory]);
                renderCategories();
                hideModal();
            } else {
                let url = bookmarkUrl.value.trim();
                if (url && !validateUrl(url)) {
                    urlError.classList.remove('hidden');
                    return;
                }
                urlError.classList.add('hidden');
                if (!url) url = '';
                if (url && !url.match(/^https?:\/\//)) url = 'https://' + url;
                const bookmark = {
                    id: editingBookmarkId || Date.now().toString(),
                    name: bookmarkName.value.trim(),
                    url: url,
                    category: bookmarkCategory.value
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

        categoryList.addEventListener('click', e => {
            const item = e.target.closest('.category-item');
            const deleteBtn = e.target.closest('.delete-category');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                showConfirmModal('Are you sure you want to delete this category and all its bookmarks?', () => {
                    let categories = storage.getCategories();
                    categories = categories.filter(c => c.id !== id);
                    storage.saveCategories(categories);
                    let bookmarks = storage.getBookmarks();
                    bookmarks = bookmarks.filter(b => b.category !== id);
                    storage.saveBookmarks(bookmarks);
                    if (selectedCategory === id) {
                        selectedCategory = null;
                        currentCategory.textContent = 'All Bookmarks';
                    }
                    renderCategories();
                    renderBookmarks();
                });
            } else if (item) {
                selectedCategory = item.dataset.id === 'all' ? null : item.dataset.id;
                currentCategory.textContent = selectedCategory
                    ? storage.getCategories().find(c => c.id === selectedCategory).name
                    : 'All Bookmarks';
                renderCategories();
                renderBookmarks();
            }
        });

        categoryBar.addEventListener('click', e => {
            const btn = e.target.closest('.category-btn');
            if (btn) {
                selectedCategory = btn.dataset.id === 'all' ? null : btn.dataset.id;
                currentCategory.textContent = selectedCategory
                    ? storage.getCategories().find(c => c.id === selectedCategory).name
                    : 'All Bookmarks';
                renderCategories();
                renderBookmarks();
            }
        });

        bookmarkList.addEventListener('click', e => {
            const editBtn = e.target.closest('.edit-bookmark');
            const deleteBtn = e.target.closest('.delete-bookmark');
            if (editBtn) {
                editingBookmarkId = editBtn.dataset.id;
                const bookmark = storage.getBookmarks().find(b => b.id === editingBookmarkId);
                showModal('Edit Bookmark', bookmark);
            } else if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                showConfirmModal('Are you sure you want to delete this bookmark?', () => {
                    const bookmarkItem = bookmarkList.querySelector(`[data-id="${id}"]`);
                    bookmarkItem.classList.add('dissolve');
                    setTimeout(() => {
                        let bookmarks = storage.getBookmarks();
                        bookmarks = bookmarks.filter(b => b.id !== id);
                        storage.saveBookmarks(bookmarks);
                        renderBookmarks();
                    }, 300);
                });
            }
        });

        confirmCancel.addEventListener('click', hideConfirmModal);

        confirmDelete.addEventListener('click', () => {
            if (deleteCallback) deleteCallback();
            hideConfirmModal();
        });

        const debouncedSearch = debounce(() => {
            renderBookmarks(searchBar.value);
        }, 300);

        searchBar.addEventListener('input', debouncedSearch);

        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', importBookmarks);

        exportBtn.addEventListener('click', exportBookmarks);

        themeToggle.addEventListener('click', () => {
            const currentTheme = storage.getTheme();
            setTheme(currentTheme === 'white' ? 'dark' : 'white');
            renderBookmarks(searchBar.value);
        });

        linkCircle.addEventListener('click', () => {
            linkOverlay.style.display = 'flex';
        });

        linkOverlayClose.addEventListener('click', () => {
            linkOverlay.style.display = 'none';
        });

        linkOverlay.addEventListener('click', e => {
            if (e.target === linkOverlay) {
                linkOverlay.style.display = 'none';
            }
        });

        // Initialize
        showLoader();
        renderCategories();
        renderBookmarks();
