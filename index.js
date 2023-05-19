/*
* Author: DC-Nam
* FB: https://www.facebook.com/levy.nam.2k5
*/

// vui lòng không chỉnh sửa hoặc xóa bên trên.


let express = require('express');
let fs = require('fs');

global.cwd = process.cwd();
global.now = ()=>Date.now()+25200000;
global.log = console.log;
global.utils = require('./utils.js');
let app = express();
let statusHTML = (res, code)=>res.status(code).sendFile(cwd+`/public/status/${code}.html`);
let db = {};
let save = ()=>fs.writeFileSync('./db', new Buffer(JSON.stringify(db)).toString('base64'));
if (!fs.existsSync('./db'))save();

db = JSON.parse(new Buffer(fs.readFileSync('./db', 'utf8'), 'base64').toString('utf8'));

let header_css = `      body {
margin: 0;
padding: 0;
}

header {
background-color: #333;
height: 55px;
display: flex;
justify-content: space-between;
align-items: center;
padding: 0 15px;
}

header a {
color: white;
text-decoration: none;
}

header nav ul {
list-style: none;
margin: 0;
padding: 0;
display: flex;
}

header nav li {
margin-left: 10px;
}

header nav a {
color: white;
font-size: 15px;
}`;
let header_html = `    <header>
<a href="/"><h2>Web Ghi Chú Trankhuong 📝</h2></a>
<nav>
<ul>
<li><a href="/new">Tạo</a></li>
<li><a href="/list">Danh sách</a></li>
<li><a onclick="['name', 'password'].forEach($=>document.cookie = \`\${$}=null;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/\`);location.reload()">Logout</a></li>
</ul>
</nav>
</header>`;
let footer_css = `footer {
background-color: #d3d3de;
padding: 10px;
text-align: center;
}`;
let footer_html = `<br><br><footer>
<p>&copy; 2023 Ghi Chú. DC-Nam</p>
</footer>`;

app.use(express.json({
    limit: 1024*1024*1, // giới hạn post body 1 MB
}));
app.get('/', (req, res, next)=> {
    if (!check_signin(req))return res.sendFile(cwd+'/public/sign in & up.html');
    let top_view_all = [];
    for (let account of db.account || [])for (let note of account.data.note)top_view_all.push({
        uid: account.id, name: account.name, ...note,
    });
    top_view_all.sort((a, b)=>a.view > b.view?-1: 0);
    let top_view_css = `.Top_view {
    border: 3px dashed red;
    }
    .Top_view table {
    width: 100%;
    border-collapse: collapse;
    }

    .Top_view table th, .Top_view table td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    }

    .Top_view table th {
    background-color: #f2f2f2;
    }`;
    let top_view_html = `<div class="Top_view">
    <table>
    <tr>
    <th>Hạng</th>
    <th>Tiêu Đề</th>
    <th>Mô Tả</th>
    <th>Lượt Xem</th>
    </tr>
    ${top_view_all.slice(0, 10).map(($, i)=>`
        <tr onclick="location.href = '/@${$.name}/${$.id}'">
        <td>${i+1}</td>
        <td>${$.title || 'Not'}</td>
        <td>${$.desc || 'Not'}</td>
        <td>${$.view}</td>
        </tr>
        `).join('')}
    </table>
    </div>`

    res.send(`<!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <title>Ghi Chú</title>
        <style type="text/css" media="all">
        ${top_view_css}
        ${header_css}
        ${footer_css}
        </style>
        </head>
        <body>
        ${header_html}
        <br><hr>
        <h3>Xếp Hạng Lượt Xem</h3>:
        ${top_view_html}
        ${footer_html}
        </body>
        </html>`)
});
app.get(/^\/sign([^]*)/, (req, res, next)=> {
    let {
        name: nameInput,
        password: passwordInput,
    } = Object.keys(req.query).length == 0 ? utils.cookieStringToObject(req.headers.cookie): req.query;

    if (!db.account)db.account = [];
    if (!nameInput || !passwordInput)return res.status(400).send(`❗ Chưa nhập tài khoản hoặc mật khẩu!`);

    let findAccount = db.account.find($=>$.name == nameInput);


    if (/^\/signup/.test(req.url)) {
        if (!/^[a-z]*$/.test(nameInput))return res.status(400).send(`❗ Tên Tài Khoản Không Hợp Lệ!`);
        if (!!findAccount)return res.status(400).send(`❗ Tài Khoản Đã Tồn Tại!`);

        db.account.push({
            id: db.account.length+1, name: nameInput, password: passwordInput, timestamp: now(), data: {
                note: [],
            }
        });
        res.send(`✅ Đăng Ký Thành Công!`);
    };

    if (/^\/signin/.test(req.url)) {
        if (!findAccount || passwordInput != findAccount.password)return res.status(400).send(`❗ Tài Khoản Hoặc Mật Khẩu Không Đúng!`);

        res.send(`✅ Đăng Nhập Thành Công!`);
    };

    if (!findAccount)return res.status(400).send(`❗ Tài Khoản Hoặc Mật Khẩu Chưa Chính Xác!`);

    next();
});
//app.get('/test', (req, res)=>res.send(db));
app.get(/^\/@/, (req, res)=> {
    let note_css = `
    #note {
    width: 95.7%;
    padding: 5px;
    background-color: #fff;
    resize: none;
    border-radius: 10px;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.3);
    border: 2px solid #ccc;
    }
    `;
    let ts_css = `
    .ts button {
    margin-left: 7px;
    padding: 4px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    }
    `;
    let cookie = utils.cookieStringToObject(req.headers.cookie);
    let paramsUrl = req.url.split(/\/|\?/).filter($=>!!$);
    let username = paramsUrl[0].replace(/^@/, '');
    let q = req.query;
    let findUser = db.account.find($=>$.name == username)

    if (!findUser)return statusHTML(res, 404);
    if (!paramsUrl[1])return res.send(list_note(findUser));

    let findNote = findUser.data.note.find($=>$.id == paramsUrl[1]);

    if (!findNote || (findNote.mode_access == 'private' && username != cookie.name))statusHTML(res, 404); else {
        let title_html = `<h2>${findNote.title || 'Không Tiêu Đề'}</h2>`;
        let status_html = `<small><i>Ghi chú ${findNote.mode_access == 'public'?'Công Khai': 'Riêng Tư'} và ${findNote.view} Lượt Xem, Thời gian tạo ${new Date(findNote.timestamp).toLocaleString()}</i></small><hr>`;
        let texta_html = `<textarea id="note" rows="25" readonly="">${utils.htmlToText(findNote.text)}</textarea>`;
        let ts_html = n=>`<div class="ts"><button id="copy" onclick="copyNote()">Copy</button>${(['', '<button id="edit_note" onclick="editNote()">Edit</button>'][n])}<button onclick="location.href = '?type=raw'">Raw</button></div>`;
        if (!!findNote.password) {
            let prompt_password = t=>`<script type="text/javascript" charset="utf-8">
            let password = prompt('${t}');
            let [url, q] = location.href.split('?');
            location.href = url+'?password='+password+'&'+q;
            </script>`;

            if (!q.password && ''+q.password != 'null')return res.status(403).send(prompt_password(`❗ Trang web cần mật khẩu để truy cập!`));
            else if (''+q.password == 'null')return statusHTML(res, 403);
            else if (q.password != findNote.password)return res.status(403).send(prompt_password(`❗ Mật khẩu "${q.password}" chưa chính xác!`));
        };
        ++findNote.view;
        if (q.type == 'raw')res.header('content-type', 'text/plain; charset=UTF-8').send(findNote.text); else if (!check_signin(req, username))res.send(`<!DOCTYPE html >
            <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="content-type" content="text/html; charset=utf-8" />
            <title>${findNote.title}</title>
            <script type="text/javascript" charset="utf-8">
            function copyNote() {
            let note = document.querySelector('#note');
            note.select();
            document.execCommand("copy");
            alert('Đã Sao Chép Văn Bản.');
            };
            </script>
            <style type="text/css" media="all">
            ${footer_css}
            ${header_css}
            ${note_css}
            ${ts_css}
            </style>
            </head>
            <body>
            ${header_html}
            ${title_html}
            <p>
            ${findNote.desc || 'Không Mô Tả'}
            </p>
            <hr>
            <div class="main">
            ${status_html}
            ${texta_html}
            ${ts_html(0)}
            </div>
            </div>
            ${footer_html}
            </body>
            </html>`); else res.send(`<!DOCTYPE html>
            <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="content-type" content="text/html; charset=utf-8" />
            <title>${findNote.title}</title>
            <script src="/public/function.js" type="text/javascript" charset="utf-8"></script>
            <script type="text/javascript" charset="utf-8">
            function copyNote() {
            let note = document.querySelector('#note');
            note.select();
            document.execCommand("copy");
            alert('Đã Sao Chép Văn Bản.');
            };
            function editNote() {
            let note = document.querySelector('#note');
            let mode_edit = document.querySelector('#mode-readonly');
            if (note.getAttribute('readonly') != null)(note.removeAttribute('readonly'), mode_edit.innerHTML = 'Tắt'); else (note.setAttribute('readonly', ''), mode_edit.innerHTML = 'Bật');
            };
            async function update_note() {
            let input = i=>document.querySelector(i);
            let text = input('#note').value;
            let title = input('#input-title').value;
            let desc = input('#input-desc').value;
            let password = input('#input-password').value;
            let time_unlink = input('#input-time-unlink').value; if (!!time_unlink && /Invalid/.test(new Date(time_unlink)))return alert('Thử Lại Nhập Thời Gian Tự Gỡ Note Với Định Dạng: HH:MM:SS dd/mm/yyyy');
            let mode_access = input('#input-mode-access').value;
            let res = await http('/update-note', {
            method: 'post',
            body: JSON.stringify({
            id: location.href.split(/\\/|\\?[^]*/).filter($=>!!$).pop(), text, title, desc, password, time_unlink, mode_access,
            }),
            headers: {
            'content-type': 'application/json'
            }
            }).catch($=>$);

            alert(await res.text());
            };
            </script>
            <style type="text/css" media="all">
            ${footer_css}
            ${header_css}
            ${note_css}
            ${ts_css}
            .option {
            text-align: center;
            }
            .option .a {
            margin-bottom: 10px;
            padding: 5px;
            padding-left: 12px;
            border: 2px solid #CCCCFF;
            border-radius: 5px;
            }
            #confim-update {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            }
            </style>
            </head>
            <body>
            ${header_html}
            ${title_html}
            <p>
            ${findNote.desc || 'Không Mô Tả'}
            </p>
            <hr>
            <div class="main">
            ${status_html}
            ${texta_html}
            ${ts_html(1)}
            <div class="option">
            <h3>Tùy Chỉnh</h3>
            <input class="a" id="input-title" type="text" value="${findNote.title}" placeholder="Tiêu Đề" />
            <input class="a" id="input-desc" type="text" value="${findNote.desc}" placeholder="Mô Tả" />
            <input class="a" id="input-password" type="text" value="${findNote.password}" placeholder="Mật Khẩu" />
            <input class="a" type="text" id="input-time-unlink" value="${findNote.time_unlink}" placeholder="Thời Gian Tự Gỡ Note" />
            <br><select class="a" id="input-mode-access">
            <option value="${findNote.mode_access}">${findNote.mode_access == 'public'?'Công Khai': 'Riêng Tư'}</option>
            <option value="${findNote.mode_access == 'private'?'public': 'private'}">${findNote.mode_access == 'private'?'Công Khai': 'Riêng Tư'}</option>
            </select>
            </div>
            <div>
            <button id="confim-update" onclick="update_note()">Cập Nhật</button>
            </div>
            </div>
            ${footer_html}
            </body>
            </html>`);
    };
});
app.get('/list', (req, res)=> {
    let account = check_signin(req);

    if (!account)return res.redirect('/');

    res.send(list_note(account));
});
app.get('/new', (req, res)=> {
    if (!check_signin(req))return res.redirect('/');

    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Tạo</title>
    <script src="/public/function.js" type="text/javascript" charset="utf-8"></script>
    <script type="text/javascript" charset="utf-8">
        async function save() {
            let input = i=>document.querySelector(i);
            let text = input('#note').value;
            let title = input('#input-title').value;
            let desc = input('#input-desc').value;
            let password = input('#input-password').value;
            let time_unlink = input('#input-time-unlink').value; if (!!time_unlink && /Invalid/.test(new Date(time_unlink)))return alert('Thử Lại Nhập Thời Gian Tự Gỡ Note Với Định Dạng: HH:MM:SS dd/mm/yyyy');
            let mode_access = input('#input-mode-access').value;
            let res = await http('/save-note', {
                method: 'post',
                body: JSON.stringify({
                    text, title, desc, password, mode_access, time_unlink
                }),
                headers: {
                    'content-type': 'application/json'
                }
            }).catch($=>$);

            if (res.status != 200)return alert((res.text ? await res.text(): false) || 'Http Request Error');
            location.href = res.headers.get('href');
        };
    </script>
    <style type="text/css" media="all">
    ${header_css}
    ${footer_css}
        .option {
            text-align: center;
        }
        .option .a {
            margin-bottom: 10px;
            padding: 5px;
            padding-left: 12px;
            border: 2px solid #CCCCFF;
            border-radius: 5px;
        }

        h1 {
            text-align: center;
        }

        #note {
            width: 95.7%;
            padding: 5px;
            background-color: #fff;
            resize: none;
            border-radius: 10px; 
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.3); 
            border: 2px solid #ccc; 
        }

        #save {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
${header_html}
    <div class="main">
        <h1>New</h1>
        <textarea id="note" rows="30" placeholder="Nhập Văn Bản..." required=""></textarea>
        <div class="option">
            <h3>Tùy Chỉnh</h3>
            <input class="a" id="input-title" type="text" placeholder="Tiêu Đề" />
            <input class="a" id="input-desc" type="text" placeholder="Mô Tả" />
            <input class="a" id="input-password" type="password" placeholder="Mật Khẩu" />
            <input class="a" type="text" id="input-time-unlink" placeholder="Thời Gian Tự Gỡ Note" />
            <br><select class="a" id="input-mode-access">
                <option value="public">Công Khai</option>
                <option value="private">Riêng Tư</option>
            </select>
        </div>
        <button id="save" onclick="save()">Lưu</button>
    </div>
    ${footer_html}
</body>
</html>`);
});
app.post('/update-note', (req, res)=> {
    let account = check_signin(req);

    if (!account)return res.status(403).send(`❗ Vui Lòng Đăng Nhập!`);

    let b = req.body;
    let findNote = account.data.note.find($=>$.id == b.id);

    if (!findNote)return res.status(404).send(`Ghi Chú ID "${b.id}" Không Tồn Tại!`);

    for (let [key, value]of(Object.entries(b)))findNote[key] = value;

    res.send(`Đã Cập Nhật Ghi Chú ID "${findNote.id}"`);
});
app.post('/save-note', (req, res)=> {
    let account = check_signin(req);

    if (!account)return res.status(403).send(`❗ Vui Lòng Đăng Nhập!`);

    let b = req.body;

    if (!b.text)return res.status(400).send(`Không Có Văn Bản Nào Được Nhập!`);


    let idNote = account.data.note.length+1;
    account.data.note.push({
        id: idNote, ...b, timestamp: now(), view: 0,
    });

    res.set({
        href: `/@${account.name}/${idNote}`,
    }).send('Đã Lưu Văn Bản');
});
app.use((req, res, next)=> {
    if (/^\/public\//.test(req.url))return res.sendFile(cwd+decodeURI(req.url.split('?')[0]));

    statusHTML(res, 404);
});
app.listen(1004);

setInterval(function() {
    for (let account of db.account || []) {
        for (let note of account.data.note) {
            if (typeof note.view != 'number')note.view = 0;
            if (!!note.time_unlink && now() >= new Date(note.time_unlink).getTime()) {
                account.data.note.splice(account.data.note.findIndex($=>$.id == note.id), 1);
            };

        };

    };
}, 100);
let dbStr = JSON.stringify(db);
setInterval(function() {
    let dbStr_ = JSON.stringify(db);

    if (dbStr_ != dbStr) {
        dbStr = dbStr_;
        save();
    };
}, 100);

function check_signin(req, name) {
    let cookie = utils.cookieStringToObject(req.headers.cookie);
    let findAccount = db.account?.find($=>$.name == cookie.name); if (!findAccount)return false;
    let findAccount_ = db.account?.find($=>$.name == name);

    if (!!name && !!findAccount_ && (name != cookie.name || cookie.password != findAccount_.password))return false;
    if (!findAccount || cookie.password != findAccount.password)return false;
    return findAccount;
};
function list_note(account) {
    return `<!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Danh sách ghi chú</title>
    <style type="text/css" media="all">
    ${header_css}
    ${footer_css}
    h1 {
    text-align: center;
    margin-top: 30px;
    }
    .notes-list {
    padding: 0;
    }
    .preview-note li {
    background-color: #EEEEEE;
    border: 2px solid #CCCCFF;
    border-radius: 10px;
    margin-bottom: 15px;
    padding: 15px;
    }
    h3 {
    text-align: center;
    margin: 0;
    margin-bottom: 10px;
    }
    p {
    text-align: center;
    color: black;
    font-size: 16px;
    line-height: 2;
    margin: 0;
    margin-bottom: 15px;
    }
    .note-date {
    color: #999;
    font-size: 12px;
    }
    .preview-note {
    text-decoration: none;
    }
    </style>
    </head>
    <body>
    ${header_html}
    <h1>Danh sách ${account.data.note.length} ghi chú</h1>

    <ul class="notes-list">
    ${account.data.note.map($=>`<a class="preview-note" href="/@${account.name}/${$.id}"><li>
        <h3>${$.title || 'Không Tiêu Đề'}</h3>
        <hr>
        <p>
        ${$.desc || 'Không Mô Tả'}
        </p>
        <i class="note-date">Thời Gian Tạo: ${new Date($.timestamp).toLocaleString()} Với ${$.view} Lượt Xem</i>
        </li>
        </a>`).join('')}
    </ul>
    ${footer_html}
    </body>
    </html>`;
};
