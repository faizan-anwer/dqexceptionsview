document.addEventListener('DOMContentLoaded', () => {
    const foldersDiv = document.getElementById('folders');
    const filesDiv = document.getElementById('files');
    const contentDiv = document.getElementById('fileContent');

    let isLoggedIn = true;
    let selectedFolder = null;

    async function fetchFolders() {
        if (isLoggedIn) {
            const response = await fetch('/folder');
            const folders = await response.json();
            console.log("Folder --", folders)
            foldersDiv.innerHTML = '';
            for (const folder of folders) {
                const folderButton = document.createElement('button');
                folderButton.innerText = folder;
                folderButton.addEventListener('click', () => fetchFiles(folder));
                foldersDiv.appendChild(folderButton);
            }
        } else {
            foldersDiv.innerHTML = '';
        }
        filesDiv.innerHTML = '';
        contentDiv.innerHTML = '';
    }

    async function fetchFiles(folder) {
        selectedFolder = folder;
        if (isLoggedIn) {
            const response = await fetch(`/files/${folder}`);
            const files = await response.json();

            filesDiv.innerHTML = '';
            for (const file of files) {
                const fileItem = document.createElement('div');
                fileItem.innerText = file;
                fileItem.addEventListener('click', () => fetchFileContent(folder, file));
                filesDiv.appendChild(fileItem);
            }
        } else {
            filesDiv.innerHTML = '<p>Please log in to view files.</p>';
        }
        contentDiv.innerHTML = '';
    }

    async function fetchFileContent(folder, file) {
        if (isLoggedIn) {
            const response = await fetch(`/file-content/${folder}/${file}`);
            const content = await response.text();

            contentDiv.innerHTML = `
                <h2>${file}</h2>
                <div id="csvTable"></div>
            `;

            const csvTable = document.getElementById('csvTable');
            const lines = content.split('\n');
            const table = document.createElement('table');

            const headers = lines[0].split(',');
            const headerRow = document.createElement('tr');
            for (const header of headers) {
                const headerCell = document.createElement('th');
                headerCell.innerText = header;
                headerRow.appendChild(headerCell);
            }
            table.appendChild(headerRow);

            for (let i = 1; i < lines.length; i++) {
                const cells = lines[i].split(',');
                const row = document.createElement('tr');
                for (const cell of cells) {
                    const cellElem = document.createElement('td');
                    cellElem.innerText = cell;
                    row.appendChild(cellElem);
                }
                table.appendChild(row);
            }
            csvTable.appendChild(table);


        } else {
            contentDiv.innerHTML = '<p>Please log in to view file content.</p>';
        }
    }

    fetchFolders();
});