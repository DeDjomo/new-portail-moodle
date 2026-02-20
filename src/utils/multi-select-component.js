/**
 * Custom Multi-select Dropdown Component for Portal Backend
 * Transform a native <select multiple> into a modern dropdown with checkboxes.
 */

export function initMultiSelect(selectId, placeholder = "Choisir des instructeurs...") {
    const originalSelect = document.getElementById(selectId);
    if (!originalSelect) return null;

    // Preventive check: already initialized?
    if (originalSelect.dataset.multiSelectInit) {
        return originalSelect._multiSelectRef || null;
    }

    // 1. Hide original select
    originalSelect.style.display = 'none';
    originalSelect.dataset.multiSelectInit = "true";

    // 2. Wrap in container
    const container = document.createElement('div');
    container.className = 'custom-multi-select';
    originalSelect.parentNode.insertBefore(container, originalSelect);
    container.appendChild(originalSelect);

    // 3. Create Header (Toggle)
    const header = document.createElement('div');
    header.className = 'multi-select-header';
    header.innerHTML = `
        <span class="selected-text">${placeholder}</span>
        <i class="fas fa-chevron-down"></i>
    `;
    container.appendChild(header);

    // 4. Create Options List Container
    const optionsList = document.createElement('div');
    optionsList.className = 'multi-select-options';
    container.appendChild(optionsList);

    // --- Logic ---

    function updateHeader() {
        const selected = Array.from(originalSelect.selectedOptions).map(opt => opt.text);
        const textSpan = header.querySelector('.selected-text');

        if (selected.length === 0) {
            textSpan.textContent = placeholder;
            textSpan.classList.add('is-placeholder');
        } else {
            textSpan.textContent = selected.join(', ');
            textSpan.classList.remove('is-placeholder');
        }
    }

    function renderOptions() {
        optionsList.innerHTML = '';
        const groups = originalSelect.querySelectorAll('optgroup');

        if (groups.length > 0) {
            groups.forEach(group => {
                const groupTitle = document.createElement('div');
                groupTitle.className = 'multi-select-group-title';
                groupTitle.textContent = group.label;
                optionsList.appendChild(groupTitle);

                Array.from(group.querySelectorAll('option')).forEach(opt => {
                    createOptionElement(opt);
                });
            });
        } else {
            Array.from(originalSelect.querySelectorAll('option')).forEach(opt => {
                if (opt.value === "" && opt.disabled) return;
                createOptionElement(opt);
            });
        }
        updateHeader();
    }

    function createOptionElement(opt) {
        if (!opt.value && opt.textContent.includes('...')) return;

        const item = document.createElement('div');
        item.className = 'multi-select-option';
        if (opt.selected) item.classList.add('selected');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = opt.selected;
        checkbox.tabIndex = -1;

        const label = document.createElement('label');
        label.textContent = opt.textContent;
        label.style.cursor = 'pointer';

        item.appendChild(checkbox);
        item.appendChild(label);

        // Click handler for the whole row
        item.addEventListener('click', (e) => {
            e.stopPropagation();

            // If the user clicked directly on the checkbox, 
            // the checkbox state is already toggled.
            // If they clicked the row, we toggle it manually.
            if (e.target !== checkbox) {
                opt.selected = !opt.selected;
                checkbox.checked = opt.selected;
            } else {
                opt.selected = checkbox.checked;
            }

            item.classList.toggle('selected', opt.selected);
            updateHeader();

            // Trigger change on original select for form data collection
            originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });

        optionsList.appendChild(item);
    }

    // Toggle Dropdown
    header.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsList.classList.toggle('active');
        header.classList.toggle('active');

        const icon = header.querySelector('i');
        if (optionsList.classList.contains('active')) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    });

    // Close on outside click
    const closeDropdown = () => {
        optionsList.classList.remove('active');
        header.classList.remove('active');
        header.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    };

    window.addEventListener('click', closeDropdown);

    // Initial render
    renderOptions();

    // Watch for changes in original select (useful for dynamic population)
    const observer = new MutationObserver((mutations) => {
        // Only re-render if options changed
        renderOptions();
    });
    observer.observe(originalSelect, { childList: true, subtree: true });

    const api = {
        refresh: () => renderOptions(),
        close: () => closeDropdown()
    };

    originalSelect._multiSelectRef = api;
    return api;
}
