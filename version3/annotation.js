// オムニバス用にデータの読み込みや書き出し等を作り替えた

// 定数
const sizeDown = 0.56;
const gray = [150, 150, 150];
const green = [0, 153, 51];
const yellow = [255, 204, 0];

const title = coordinateData["title"];
const pages = coordinateData["pages"];

const imgPath = "Local/images/"; // テストと配布版で異なる場合があるから注意

const pageClassList = ["第一四分位数", "中央値", "最大値"];

// 各ページの座標データおよび作品データ
let pageData;

// フラグ
let isClicked = false; //コマが選択されているか否か
let saved = false; // このページのアノテーションが保存されているか否か

// カウンタ
let dataIndex = 0;
let doneCounter = 0; // 各段階の終了条件に使うカウンタ
// 各段階、コマの数(コマ順、対応関係)もしくはテキストの数(テキスト順)と同じになったら終了ボタンが押せるようになる

// 各ページのオブジェクトを入れるリスト
let boxItems;

// 表示に関する変数
let bgImage;
let bgLayer;
let boxLayer;
let imageObj;

// アノテーションに関する変数
// 全段階共通
// 各段階のクラスのインスタンスを入れる変数
let presentProcess;
// このページの各アノテーションを一時的に入れる配列
let annotation = []; // 中身：frameOrder, textOrder, connected
// 保存の時にconnected(annotation)をunconnectedTextsと一緒にalignmentに入れた上でoutputObjに入れる
let outputObj = {}; // 出力する連想配列

// 対応関係
let key1; // 中身：frameId
let key2; // 中身：textsInFrame
let unconnectedTexts; // どのコマとも対応していないテキストを入れる配列

// クラス
const BoxObj = function (rectDict) {
	this.box = new Konva.Rect(rectDict);
	this.isSelected = false;
	this.isConnected = false;
};

const PageData = function (frame, text, genre, mangaTitel, pageIndex, pageClass) {
	// frameがundefinedだった場合[]を代入する
	this.frame = frame || [];
	this.text = text || [];
	this.genre = genre;
	this.mangaTitel = mangaTitel;
	this.pageIndex = pageIndex;
	this.pageClass = pageClass;
};

// 読み順クラス(OrderClass)
const OrderClass = function () {
	// 変数の初期化
	this.initValues = () => {
		annotation = [];
		doneCounter = 0;
	};
	// 初期描画と同じ描画(多分returnDisplayと似たことをやると思う)
	this.initDrawSetting = (boxItem) => {
		boxItem.box.stroke("rgba(" + this.strokeColor + ", 1" + ")");
		boxItem.box.strokeWidth(3);
		boxItem.box.fill("rgba(" + green + ", 0" + ")");
		boxLayer.draw();
	};
	// annotationをoutputObjに入れる
	this.finishProcess = () => {
		outputObj[this.processName] = annotation;
		console.log(outputObj);
	};
	// イベント処理
	this.onMouseup = (actionedItem, event) => {
		// 押された矩形のisSelectedがfalseだったら
		if (actionedItem.isSelected == false) {
			doneCounter++;
			// 押された矩形のidをannotationに代入
			annotation.push(event.currentTarget.attrs.id);
			// 押された矩形のisSelectedのtrueにする
			actionedItem.isSelected = true;
			// 押された矩形の描画を灰色にする
			drawGrayBox(actionedItem);
			// ボタンの色
			if (doneCounter != boxItems.length) {
				cssColor("return button", "white-button");
			} else {
				cssColor("finish-button", "yellow-finish-button");
			}
		}
	};
	this.onMouseover = (actionedItem) => {
		if (actionedItem.isSelected == false) {
			mouseoverDraw(actionedItem, this.strokeColor, this.strokeColor);
		}
	};
	this.onMouseout = (actionedItem) => {
		if (actionedItem.isSelected == false) {
			mouseoutDraw(actionedItem, this.strokeColor, this.strokeColor);
		}
	};
};

// コマ順クラス(読み順クラスを継承)(FramesOrderClass)
const FramesOrderClass = function () {
	OrderClass.call(this); // 継承する文
	this.strokeColor = green;
	this.processName = "framesOrder";
	// boxItemsを初期化してからboxのインスタンスのリストを作成(何のboxを作るかが違う)
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(pageData.frame, "frame", green, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化(previous-processの色が違う)
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssGray("previous-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("");
		$("#finish-button").html("この段階を終了");
		changeExplanation(
			"第一段階：コマの読み順",
			"<li>このページの中で最初に読むコマを選択します。</li>\
      <li>選択したコマの次に読むコマを選択します。</li>\
      <li>直前に選択したコマの次に読むコマを選択していき、表示されているページの全コマのアノテーションが終了したら[この段階を終了]を押してください。</li>"
		);

		// フォントとボタンのサイズを変更
		let removeFinishButton = "two-lines-button small-button-font";
		let addFinishButton = "a-line-button large-button-font";
		changeClass("finish-button", removeFinishButton, addFinishButton);
	};
	// 前の段階に戻る
	this.goPreviousProcess = () => {
		// コマの読み順より前の段階は無いから空
	};
	// 次の段階に進む
	this.goNextProcess = () => {
		resetLayer();
		if (pageData.text.length != 0) {
			presentProcess = new TextsOrderClass();
		} else {
			skipTextsAnnotation();
		}
		annotationFunc();
	};
};

// テキスト順クラス(読み順クラスを継承)(TextsOrderClass)
const TextsOrderClass = function () {
	OrderClass.call(this); // 継承する文
	this.strokeColor = yellow;
	this.processName = "textOrder";
	// boxItemsを初期化してからboxのインスタンスのリストを作成(何のboxを作るかが違う)
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(pageData.text, "text", yellow, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化(previous-processの色が違う)
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssColor("previous-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("");
		// TODO: このページのアノテーションを保存を変更
		$("#finish-button").html("この段階を終了");
		changeExplanation(
			"第二段階：テキストの読み順",
			"<li>このページの中で最初に読むテキストを選択します。</li>\
      <li>選択したテキストの次に読むテキストを選択します。</li>\
      <li>直前に選択したテキストの次に読むテキストを選択していき、表示されているページの全テキストのアノテーションが終了したら[この段階を終了]を押してください。</li>"
		);
		// フォントとボタンのサイズを変更
		let removeFinishButton = "two-lines-button small-button-font";
		let addFinishButton = "a-line-button large-button-font";
		changeClass("finish-button", removeFinishButton, addFinishButton);
	};
	// 前の段階に戻る
	this.goPreviousProcess = () => {
		saved = false;
		resetLayer();
		deleteOutputObj(this.processName);
		presentProcess = new FramesOrderClass();
		deleteOutputObj(presentProcess.processName);
		annotationFunc();
	};
	// 次の段階に進む
	this.goNextProcess = () => {
		resetLayer();
		presentProcess = new ConnectingFrameAndTextClass();
		annotationFunc();
	};
};

// 対応関係クラス(ConnectingFrameAndTextClass)
const ConnectingFrameAndTextClass = function () {
	this.processName = "alignment";
	this.processKey1 = "frameId";
	this.processKey2 = "textsInFrame";
	// 変数の初期化
	this.initValues = () => {
		annotation = [];
		doneCounter = 0;
		isClicked = false;
		key1 = "";
		key2 = [];
		unconnectedTexts = [];
	};
	// boxItemsを初期化してからboxのインスタンスのリストを作成
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(pageData.frame, "frame", green, boxItems);
		makeBoxList(pageData.text, "text", gray, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		if (pageData.frame != 0) {
			cssGray("finish-button", "yellow-finish-button");
			cssColor("previous-process", "yellow-process-button");
		} else {
			cssColor("finish-button", "yellow-finish-button");
			cssGray("previous-process", "yellow-process-button");
		}
		// 文字を変える
		$("#choose-next").html("次のコマを選択");
		$("#finish-button").html("このページの<br>アノテーションを保存");

		if (pageData.frame.length == 0) {
			changeExplanation(
				"コマが無いページ",
				"<li>[このページのアノテーションを保存]を押します。</li>\
        <li>[次のページ]を押して次のページに進んでください。</li>"
			);
		} else {
			changeExplanation(
				"第三段階：コマとテキストの対応関係",
				"<li>アノテーションしていないコマのうち、基準とする任意のコマを選択します。</li>\
        <li>基準とするコマに所属するテキストを全て選択します。</li>\
        <li>選択し終えたら[次のコマを選択]もしくはキーボードのFを押します。</li>\
        <li>表示されているページの全コマのアノテーションが終了したら[このページのアノテーションを保存]を押します。</li>\
        <li>[次のページ]を押して次のページに進んでください。</li>"
			);
		}
		// フォントとボタンのサイズを変更
		let removeFinishButton = "a-line-button large-button-font";
		let addFinishButton = "two-lines-button small-button-font";
		changeClass("finish-button", removeFinishButton, addFinishButton);
	};
	// 初期描画と同じ描画(多分returnDisplayと似たことをやると思う)
	this.initDrawSetting = (boxItem) => {
		boxItem.box.strokeWidth(3);
		if (boxItem.box.name() == "frame") {
			boxItem.box.stroke("rgba(" + green + ", 1" + ")");
			boxItem.box.fill("rgba(" + green + ", 0" + ")");
		}
		if (boxItem.box.name() == "text") {
			boxItem.box.stroke("rgba(" + gray + ", 1" + ")");
			boxItem.box.fill("rgba(" + yellow + ", 0" + ")");
		}
		boxLayer.draw();
	};
	// key1とkey2とisClickedを初期化
	this.resetKeyStatus = () => {
		key1 = "";
		key2 = [];
		unconnectedTexts = [];
		isClicked = false;
	};
	// annotationをoutputObjに入れる
	this.finishProcess = () => {
		// isSelectedがfalseのテキストをunconnectedTextsに入れる
		boxItems.forEach((item) => {
			if (item.isConnected == false && item.box.name() == "text") {
				unconnectedTexts.push(item.box.id());
			}
		});
		// connected(annotation)をunconnectedTextsと一緒にalignmentに入れる
		outputObj[this.processName] = {connected: annotation, unconnectedTexts: unconnectedTexts};
		console.log(outputObj);
	};
	// 前の段階に戻る
	this.goPreviousProcess = () => {
		saved = false;
		resetLayer();
		deleteOutputObj(this.processName);
		if (pageData.text.length != 0) {
			// テキストがある場合はテキスト順に戻る
			presentProcess = new TextsOrderClass();
		} else {
			// テキストが無い場合はコマ順に戻る
			presentProcess = new FramesOrderClass();
		}
		deleteOutputObj(presentProcess.processName);
		annotationFunc();
	};
	this.goNextProcess = () => {
		// 対応関係の次の段階は無いから空
	};

	// イベント処理
	this.onMouseup = (actionedItem, event) => {
		if (actionedItem.isSelected == false) {
			if (isClicked == false) {
				if (actionedItem.box.name() == "frame") {
					this.mouseupValues1(actionedItem, event);
					this.mouseupDraw1(actionedItem);
					if (doneCounter != pageData.frame.length) {
						cssColor("return button", "white-button");
						cssColor("choose-next", "green-mode-button");
					} else {
						cssColor("finish-button", "yellow-finish-button");
					}
				}
			} else {
				if (actionedItem.box.name() == "text") {
					this.mouseupValues2(actionedItem, event);
					this.mouseupDraw2(actionedItem);
				}
			}
		}
	};
	this.onMouseover = (actionedItem) => {
		if (actionedItem.isSelected == false) {
			if (isClicked == false) {
				if (actionedItem.box.name() == "frame") {
					mouseoverDraw(actionedItem, green, green);
				}
			} else {
				if (actionedItem.box.name() == "text") {
					mouseoverDraw(actionedItem, yellow, yellow);
				}
			}
		}
	};
	this.onMouseout = (actionedItem) => {
		if (actionedItem.isSelected == false) {
			if (isClicked == false) {
				if (actionedItem.box.name() == "frame") {
					mouseoutDraw(actionedItem, green, green);
				}
			} else {
				if (actionedItem.box.name() == "text") {
					mouseoutDraw(actionedItem, yellow, yellow);
				}
			}
		}
	};
	// アノテータの動き1の値の処理
	this.mouseupValues1 = (actionedItem, event) => {
		doneCounter++;
		isClicked = true;
		key1 = event.currentTarget.attrs.id;
		actionedItem.isSelected = true;
	};
	// アノテータの動き2の値の処理
	this.mouseupValues2 = (actionedItem, event) => {
		key2.push(event.currentTarget.attrs.id);
		actionedItem.isSelected = true;
		actionedItem.isConnected = true;
	};
	// アノテータの動き1の描画の処理
	this.mouseupDraw1 = (actionedItem) => {
		boxItems.forEach((item) => {
			if (actionedItem != item) {
				if (item.isSelected == false) {
					if (item.box.name() == "frame") {
						item.box.stroke("rgba(" + gray + ", 1" + ")");
						item.box.strokeWidth(3);
						item.box.fill("rgba(" + green + ", 0" + ")");
					}
					if (item.box.name() == "text") {
						item.box.stroke("rgba(" + yellow + ", 1" + ")");
						item.box.strokeWidth(3);
						item.box.fill("rgba(" + yellow + ", 0" + ")");
					}
				}
			} else {
				actionedItem.box.stroke("rgba(" + green + ", 1" + ")");
				actionedItem.box.strokeWidth(6);
				actionedItem.box.fill("rgba(" + green + ", 0.5" + ")");
			}
		});
		boxLayer.draw();
	};
	// アノテータの動き2の描画の処理
	this.mouseupDraw2 = (actionedItem) => {
		actionedItem.box.stroke("rgba(" + yellow + ", 1" + ")");
		actionedItem.box.strokeWidth(6);
		actionedItem.box.fill("rgba(" + yellow + ", 0.5" + ")");
		boxLayer.draw();
	};
};

class BoxFlags {
	// targetIdを持つboxがboxItemsの中の何番目にあるかを返す
	static searchArg(targetId) {
		let targetArg;
		targetArg = boxItems.findIndex((item) => {
			return item.box.id() === targetId;
		});
		return targetArg;
	}
	// リストに入っているidを持つboxのフラグをfalseにする
	static list(targetList, bool) {
		targetList.forEach((targetId) => {
			this.one(targetId, bool);
		});
	}
}

class ChangeIsSelected extends BoxFlags {
	// 継承後thisキーワードを使うために必要な文
	constructor() {
		super();
	}
	// targetIdを持つboxのisSelectedをfalseにする
	static one(targetId, bool) {
		boxItems[this.searchArg(targetId)].isSelected = bool;
	}
	static both(targetId, targetList, bool) {
		this.one(targetId, bool);
		this.list(targetList, bool);
	}
}

class ChangeIsConnected extends BoxFlags {
	// 継承後thisキーワードを使うために必要な文
	constructor() {
		super();
	}
	// targetIdを持つboxのisSelectedをfalseにする
	static one(targetId, bool) {
		boxItems[this.searchArg(targetId)].isConnected = bool;
	}
}

// 関数
// boxのオブジェクトを作成する
const makeBoxObj = (xy, objName, rgb) => {
	const xmin = xy["xmin"] * sizeDown;
	const ymin = xy["ymin"] * sizeDown;
	const xmax = xy["xmax"] * sizeDown;
	const ymax = xy["ymax"] * sizeDown;
	const w = xmax - xmin;
	const h = ymax - ymin;
	const rectDict = {
		x: xmin, //配置場所
		y: ymin, //配置場所
		width: w, //横幅
		height: h, //高さ
		stroke: "rgba(" + rgb + ", 1" + ")", //枠線の色
		strokeWidth: 3, //枠線の太さ
		name: objName, //HTML要素でいうところのclass
		id: xy["id"], //HTML要素でいうところのid
	};
	const newBox = new BoxObj(rectDict);
	return newBox;
};

// boxを作成し、itemsに入れる
const makeBoxList = (xys, objName, rgb, itemList) => {
	let newBox;
	for (let i = 0; i < xys.length; i++) {
		newBox = makeBoxObj(xys[i], objName, rgb);
		itemList.push(newBox);
	}
};

// サイドバーの表示・ボタンの色
// サイドバーの情報を更新する
const renewSidebarInfo = () => {
	$("#page-counter").replaceWith(
		'<p id = "page-counter">' + String(dataIndex + 1) + "/" + pages.length + "枚目" + "</p>"
	);
	$("#page-class").replaceWith(
		'<p id = "page-class">分類：' + pageClassList[parseInt(pageData.pageClass, 10) - 1] + "</p>"
	);
	$("#genre").replaceWith('<p id = "genre">ジャンル：' + pageData.genre + "</p>");
	$("#manga-title").replaceWith('<p id = "manga-title">作品名：' + pageData.mangaTitel + "</p>");
};

// ボタンの色をカラーにする
const cssColor = (targetId, buttonClass) => {
	$("#" + targetId).removeClass("cant-push");
	$("#" + targetId).addClass(buttonClass);
};

// ボタンの色をグレーにする
const cssGray = (targetId, buttonClass) => {
	$("#" + targetId).removeClass(buttonClass);
	$("#" + targetId).addClass("cant-push");
};

// アラート
// 続きからアノテーションするか否かの確認
const confirmContinuation = () => {
	let options = {
		title: "再開するページの選択",
		text: "前回の続きからアノテーションしますか？",
		buttons: {
			beginning: {text: "最初から", value: "beginning"},
			continuation: {text: "続きから", value: "continuation"},
			optional: {text: "任意のページから", value: "optional"},
		}, // 上から順に右から表示される
	};
	swal(options).then((value) => {
		switch (value) {
			case "beginning":
				//最初から
				main();
				break;
			case "continuation":
				//続きから
				dataIndex = Number(cache);
				main();
				break;
			default:
				//任意のページから
				confirmInputPageIndex();
				break;
		}
	});
};

// 任意のページから再開する場合の入力ウィンドウ
const confirmInputPageIndex = () => {
	let options = {
		title: "再開するページの選択",
		text: "何ページ目から再開しますか？\nページ番号を半角で入力し、OKを押してください。\n(キャンセルの場合は未入力)",
		content: {
			element: "input",
			attributes: {
				placeholder: "1~" + String(pages.length),
			},
		},
	};
	swal(options).then((value) => {
		value = Number(value);
		if (value <= String(pages.length) && value > 0 && Number.isInteger(value)) {
			//正しい値が入力された場合、入力されたページから再開
			dataIndex = value - 1;
			main();
		} else if (value == 0) {
			//キャンセルされた場合、前のアラートに戻る
			confirmContinuation();
		} else {
			//入力された値が正しくない場合
			swal(
				"入力エラー",
				"値にミスがないか、全角入力ではないかなどを\n確認してください。",
				"warning"
			).then((value) => {
				if (value) {
					confirmInputPageIndex();
				}
			});
		}
	});
};

// アノテーションが保存されていないときの確認アラート
const confirmNotSave = (direction, messageTitle, messageText) => {
	let options = {
		title: messageTitle,
		text: messageText,
		buttons: {
			cancel: "キャンセル",
			ok: "移動する",
		},
	};
	swal(options).then((value) => {
		if (value) {
			if (direction == "next-page") {
				if (dataIndex < pages.length - 1) {
					// 次のページがある
					goOtherPage("next-page");
				} else {
					// 次のページが無い
					confirmLastPage();
				}
			} else {
				goOtherPage("previous-page");
			}
		}
	});
};

// 最後のページで[次のページに進む]を押した時のアラート
const confirmLastPage = () => {
	let unannotatedPages = lookUnannotatedPages();
	if (unannotatedPages.length == 0) {
		// アノテーションされていないページがなかったら終了アラートを表示
		swal("この漫画のアノテーションは終了です。お疲れ様でした。");
	} else {
		// アノテーションされていないページがあったらその一覧を表示
		let unannotatedMessage = "";
		unannotatedPages.forEach((item) => {
			unannotatedMessage = unannotatedMessage + "\n" + item + "ページ";
		});
		swal({
			icon: "warning",
			title: "アノテーションされていないページ",
			text:
				"アノテーションされていないページがあります。\n下記のページを確認してください。" +
				unannotatedMessage,
		});
	}
};

// [前の段階に戻る]を押した時の確認アラート
const confirmPreviousProcess = (messageTitle, messageText, func) => {
	let options = {
		icon: "warning",
		title: messageTitle,
		text: messageText,
		buttons: {
			cancel: "キャンセル",
			ok: "前の段階に戻る",
		},
	};
	swal(options).then((value) => {
		if (value) {
			func();
		}
	});
};

// キャッシュ
// ページのアノテーションが保存されたか否かをチェックするリストを作成
const makeCheckList = () => {
	let checkList = [];
	for (let i = 0; i < pages.length; i++) {
		checkList.push(false);
	}
	localStorage.setItem(title + "_isAnnotatedCheck", JSON.stringify(checkList));
};

// ページのアノテーションが保存されたか否かをチェックするリストを更新
const updateCheckList = () => {
	let checkList = localStorage.getItem(title + "_isAnnotatedCheck");
	checkList = JSON.parse(checkList);
	checkList[dataIndex] = true;
	localStorage.setItem(title + "_isAnnotatedCheck", JSON.stringify(checkList));
};

// ページのアノテーションが保存されたか否かをチェックするリストを確認し、アノテーションが保存されていないページ番号をリストにして返す
const lookUnannotatedPages = () => {
	let checkList = localStorage.getItem(title + "_isAnnotatedCheck");
	checkList = JSON.parse(checkList);
	let unannotatedArg = [];
	for (let i = 0; i < checkList.length; i++) {
		if (checkList[i] == false) {
			unannotatedArg.push(String(i + 1));
		}
	}
	return unannotatedArg;
};

// 部品になる関数
// リストの中身をboxの面積が大きい順に並べ替える
const sortBox = (boxList) => {
	let firstArea;
	let secondArea;
	boxList.sort(function (first, second) {
		firstArea = first.box.width() * first.box.height();
		secondArea = second.box.width() * second.box.height();
		if (firstArea > secondArea) {
			return -1;
		} else if (firstArea < secondArea) {
			return 1;
		} else {
			return 0;
		}
	});
	return boxList;
};

// boxの表示を更新する関数
const redrawBox = () => {
	boxItems.forEach((item) => {
		if (item.isSelected == false) {
			presentProcess.initDrawSetting(item);
		} else {
			drawGrayBox(item);
		}
	});
};

// 枠と塗りがグレーのボックスを描画する
const drawGrayBox = (boxItem) => {
	boxItem.box.stroke("rgba(" + gray + ", 1" + ")");
	boxItem.box.strokeWidth(3);
	boxItem.box.fill("rgba(" + gray + ", 0.5" + ")");
	boxLayer.draw();
};

// オブジェクトのmouseover時の表示変化
const mouseoverDraw = (boxItem, strokeColor, fillColor) => {
	boxItem.box.stroke("rgba(" + strokeColor + ", 0.5" + ")");
	boxItem.box.fill("rgba(" + fillColor + ", 0.3" + ")");
	boxLayer.draw();
};

// オブジェクトのmouseout時の表示変化
const mouseoutDraw = (boxItem, strokeColor, fillColor) => {
	boxItem.box.stroke("rgba(" + strokeColor + ", 1" + ")");
	boxItem.box.fill("rgba(" + fillColor + ", 0" + ")");
	boxLayer.draw();
};

// boxLayerの初期化
const resetLayer = () => {
	boxLayer.remove();
	boxLayer = new Konva.Layer(); //図形などの要素は後で追加する
	stage.add(boxLayer);
};

// HTMLのクラスを変更
const changeClass = (targetId, removeClassName, addClassName) => {
	$("#" + targetId).removeClass(removeClassName);
	$("#" + targetId).addClass(addClassName);
};

const changeExplanation = (title, explanation) => {
	$("#process-title").html(title);
	$("#process-explanation").html(explanation);
};

// annotationにkey1とkey2を入れる
const addAnnotation = (keyName1, keyName2) => {
	let pushObj = {};
	pushObj[keyName1] = key1;
	pushObj[keyName2] = key2;
	annotation.push(pushObj);
};

// outputObjに入れたオブジェクトを取り出す関数
// annotationに中身は残っている
const deleteOutputObj = (processName) => {
	// outputObjに引数のkeyのアノテーションが入っていたら取り出す
	delete outputObj[processName];
};

// JSONファイルの書き出し
const outputJsonFile = (outputObj, outputName) => {
	let outputJSON = JSON.stringify(outputObj, null, 2); // JSON形式に変換する
	// JSON.stringify(変換する値 [, 一部を出力するなどの条件(今回は無しなのでnull) [, インデント]])
	const blob = new Blob([outputJSON], {type: "application/json"}); // Blobオブジェクトを作成
	const link = document.createElement("a"); // HTMLのa要素を生成
	link.href = URL.createObjectURL(blob); // BlobオブジェクトをURLに変換
	link.download = outputName + ".json"; // ファイル名を指定
	link.click(); // a要素をクリックする処理
};

// ページを移動する
const goOtherPage = (direction) => {
	if (direction == "next-page") {
		dataIndex++;
	}
	if (direction == "previous-page") {
		dataIndex--;
	}
	localStorage.setItem(title + "_pageIndex", dataIndex);
	saved = false;
	bgLayer.remove();
	boxLayer.remove();
	main();
};

// 「次のコマを選択」を押した時の動作
const chooseNext = () => {
	// isClickedがtrueだったら
	if (isClicked == true) {
		addAnnotation(presentProcess.processKey1, presentProcess.processKey2); // annotationにkey1とkey2を入れる
		// key2に入っているidを持つboxのisSelectedをfalseに戻す
		ChangeIsSelected.list(key2, false);
		presentProcess.resetKeyStatus(); // key1とkey2とisClickedを初期化
		redrawBox(); // boxの表示を更新
		cssGray("choose-next", "green-mode-button");
	}
};

// テキストの空のアノテーションをoutputObjに入れて対応関係クラスのインスタンスを作成する
const skipTextsAnnotation = () => {
	presentProcess = new TextsOrderClass();
	presentProcess.finishProcess();
	presentProcess = new ConnectingFrameAndTextClass();
};

// アノテーション関数(annotationFunc)
const annotationFunc = () => {
	presentProcess.initValues(); // 変数の初期化
	presentProcess.makeBoxInstance(); // boxItemsを初期化してからboxのインスタンスのリストを作成
	// boxLayerの初期描画
	boxItems.forEach((item) => {
		boxLayer.add(item.box);
	});
	boxLayer.draw();
	// キャンバス内のイベント処理
	boxItems.forEach((item) => {
		item.box.on("mouseup", (e) => {
			presentProcess.onMouseup(item, e);
		});
	});
	boxItems.forEach((item) => {
		item.box.on("mouseover", () => {
			presentProcess.onMouseover(item);
		});
	});
	boxItems.forEach((item) => {
		item.box.on("mouseout", () => {
			presentProcess.onMouseout(item);
		});
	});
	// ボタンの内容と色
	presentProcess.settingHtml();
};

// main
let main = () => {
	// dataIndexページ目の座標などのデータの読み込み
	pageData = new PageData(
		pages[dataIndex]["frame"],
		pages[dataIndex]["text"],
		pages[dataIndex]["genre"],
		pages[dataIndex]["mangaTitel"],
		pages[dataIndex]["pageIndex"],
		pages[dataIndex]["pageClass"]
	);
	outputObj = {
		title: title,
		index: String(dataIndex),
		genre: pageData.genre,
		mangaTitel: pageData.mangaTitel,
		pageIndex: pageData.pageIndex,
		pageClass: pageData.pageClass,
	};
	// レイヤーのインスタンスを作成し、背景画像を読み込んで描画する
	bgLayer = new Konva.Layer();
	boxLayer = new Konva.Layer(); //図形などの要素は後で追加する
	imageObj = new Image();

	imageObj.src = imgPath + String(dataIndex).padStart(3, 0) + ".jpg";
	imageObj.onload = function () {
		bgImage = new Konva.Image({
			x: 0,
			y: 0,
			image: imageObj,
			width: 1654 * sizeDown,
			height: 1170 * sizeDown,
		});

		bgLayer.add(bgImage);
		stage.add(bgLayer, boxLayer);
		bgLayer.draw();
	};
	// サイドバーのページ数とページ移動ボタンの色
	renewSidebarInfo();
	if (dataIndex == 0) {
		cssGray("previous-page", "green-page-button");
	} else {
		cssColor("previous-page", "green-page-button");
	}
	if (dataIndex == pages.length) {
		cssGray("next-page", "green-page-button");
	} else {
		cssColor("next-page", "green-page-button");
	}

	// presentProcessのインスタンスを作成
	presentProcess = new FramesOrderClass();
	// テキストがない場合、次の段階へで、if (pageData.text.length == 0){}でoutputObjにテキスト関係の空のアノテーションを入れた上で対応関係に飛ぶ
	if (pageData.frame.length == 0) {
		// コマが無い場合
		// outputObjにコマ順とテキスト順の空のアノテーションを入れて対応関係に飛ぶ
		presentProcess.finishProcess(); // 空のframesOrderをoutputObjに入れる
		skipTextsAnnotation();
	}
	annotationFunc(); // アノテーション関数の呼び出し
};

// 実行部分
// ステージのインスタンスを作成
const stage = new Konva.Stage({
	container: "canvas", // 親要素のdivタグのidを指定
	width: 1654 * sizeDown, //キャンバスの横幅
	height: 1170 * sizeDown, //キャンバスの高さ
});
// キャッシュを確認してページの記録がある場合は読み込む
const cache = localStorage.getItem(title + "_pageIndex");
if (cache != null) {
	confirmContinuation();
} else {
	makeCheckList();
	main();
}

// ボタンの動作(最初に押せる時の条件を入れるのを忘れずに)
// この段階を最初からやり直す
$("#start-over").on("click", () => {
	// doneCounterが1以上だったら
	if (doneCounter >= 1) {
		deleteOutputObj(presentProcess.processName); // [この段階を終了]もしくは[保存]を押していた場合はoutputObjから現在の段階のアノテーションを取り出す
		saved = false;
		presentProcess.initValues(); // 変数を全て初期化
		// 全てのboxのisSelectedをfalseにする
		boxItems.forEach((item) => {
			item.isSelected = false;
			item.isConnected = false;
		});
		redrawBox(); // 全て初期描画と同じ状態に
		presentProcess.settingHtml(); // 全てのボタンを初期状態に
	}
});

// ひとつ前の作業を取り消す
$("#to-return").on("click", () => {
	// doneCounterが1以上だったら
	if (doneCounter >= 1) {
		// 変数の処理
		doneCounter--;
		saved = false;
		if (presentProcess.processName != "alignment") {
			ChangeIsSelected.one(annotation[annotation.length - 1], false);
			annotation.pop();
		} else {
			if (isClicked == true) {
				ChangeIsSelected.both(key1, key2, false);
				// key2のisConnectedもfalseに
				ChangeIsConnected.list(key2, false);
			} else {
				ChangeIsSelected.one(annotation[annotation.length - 1][presentProcess.processKey1], false);
				// annotation[-1]のkey2のisConnectedもfalseに
				ChangeIsConnected.list(
					annotation[annotation.length - 1][presentProcess.processKey2],
					false
				);
				annotation.pop();
			}
			presentProcess.resetKeyStatus();
		}
		deleteOutputObj(presentProcess.processName);
		redrawBox(); // boxの描画
		// ボタンの色の処理
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		if (annotation.length == 0) {
			// annotationの中身が空になったらreturnをグレーに
			cssGray("return button", "white-button");
		}
	}
});

// 次の〇〇を選択
$("#choose-next").on("click", chooseNext);
// キーボードバージョン追加
$("html").keyup((e) => {
	if (e.which == "70") {
		chooseNext();
	}
});

// finish-button
$("#finish-button").on("click", () => {
	if (outputObj[presentProcess.processName] == undefined) {
		if (presentProcess.processName != "alignment") {
			// [この段階を終了]
			// doneCounterがboxItems.lengthと同じだったら(全boxが選択済みだったら)
			if (doneCounter == boxItems.length) {
				presentProcess.finishProcess(); // annotationをoutputObjに入れる
				// このボタンをグレーにする
				cssGray("finish-button", "yellow-finish-button");
				presentProcess.goNextProcess(); // 対応関係の場合は空
			}
		} else {
			// [このページのアノテーションを保存]
			// 全frameが選択済みだったら
			if (doneCounter == pageData.frame.length) {
				if (annotation.length != doneCounter) {
					addAnnotation(presentProcess.processKey1, presentProcess.processKey2); // annotationにkey1とkey2を入れる
				}
				presentProcess.finishProcess();
				presentProcess.resetKeyStatus();
				// JSONに変換して書き出し
				outputJsonFile(outputObj, title + "_" + String(dataIndex).padStart(3, 0));
				saved = true;
				updateCheckList(); // ページのアノテーションが保存されたか否かをチェックするリストを更新
				redrawBox();
				cssGray("finish-button", "yellow-finish-button"); // このボタンをグレーにする
			}
		}
	}
});

// 前の段階に戻る
$("#previous-process").on("click", () => {
	// コマが一つも無いかコマ順の段階の場合は押せない
	if (pageData.frame.length != 0 && presentProcess.processName != "framesOrder") {
		// アノテーションした結果がリセットされるけど良い？というアラートを出して、OKと言われたら実行
		confirmPreviousProcess(
			"前の段階に戻る",
			"この段階とその前の段階のアノテーション結果がリセットされますがよろしいですか？",
			presentProcess.goPreviousProcess // コマ順の場合は空
		);
	}
});

// 次のページに進む
$("#next-page").on("click", () => {
	if (saved == true) {
		// このページのアノテーションが保存されている
		if (dataIndex < pages.length - 1) {
			// 次のページがある
			goOtherPage("next-page"); // 移動する
		} else {
			// 次のページがない
			confirmLastPage();
		}
	} else {
		// このページのアノテーションが保存されていない
		// アラートを出して、それでも良いと言われたら移動する
		confirmNotSave("next-page", "アノテーションが終わっていません", "このまま移動しますか？");
	}
});

// 前のページに戻る
$("#previous-page").on("click", () => {
	if (dataIndex >= 1) {
		// 前のページがある
		if (saved == true) {
			// このページのアノテーションが保存されている
			goOtherPage("previous-page"); // 移動する
		} else {
			// このページのアノテーションが保存されていない
			// アラートを出して、それでも良いと言われたら移動する
			confirmNotSave("previous-page", "アノテーションが終わっていません", "このまま移動しますか？");
		}
	}
});
