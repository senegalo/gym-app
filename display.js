class Display {
    static createRows(rows, rowClass) {
        return rows.map(row => {
            const tr = document.createElement("tr");
            if (rowClass) {
                tr.classList.add(rowClass);
            }

            row.forEach(col => {
                const td = document.createElement("td");
                td.append(col);
                tr.append(td);
            })
           return tr; 
        });
    }

    static createLink(text, action) {
        const actionLink = document.createElement("a");
        actionLink.append(text);
        actionLink.href = "javascript:void(0)";
        actionLink.onclick = action;
        return actionLink;
    }

    static confirmActionLink(text, confirmActionText, action) {
        const confirmedAction = () => { if(confirm(confirmActionText)) action() }
        return this.createLink(text, confirmedAction);
    }

    static formatDateTime(timestamp) {
        return (new Date(timestamp)).toLocaleString();
    }

    static removeElementsByClassname(className) {
        const elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].remove();
        }
    }
}