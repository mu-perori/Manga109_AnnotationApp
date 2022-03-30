// 定数
const sizeDown = 0.56;
const gray = [150, 150, 150];
const green = [0, 153, 51];
const yellow = [255, 204, 0];

const title = coordinateData["title"];
const pages = coordinateData["pages"];

const imgPath = "images/";

// 各ページの座標データ
let frameData = []; //コマの座標データ
let textData = []; //テキストの座標データ

// フラグ
let isClicked = false; //コマが選択されているか否か
let saved = false; // このページのアノテーションが保存されているか否か

// カウンタ
let pageIndex = 0;
let doneCounter = 0; // 各段階の終了条件に使うカウンタ
// 各段階、コマの数(コマ順、対応関係)もしくはテキストの数(テキスト順、種別)と同じになったら終了ボタンが押せるようになる

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
let annotation = []; // 中身：frameOrder, textOrder, textClassification, connected
// 保存の時にconnected(annotation)をunconnectedTextsと一緒にalignmentに入れた上でoutputObjに入れる
let key1; // 中身：currentFrame, currentText, textId, frameId
let key2; // 中身：nextFrame, nextText, classification, textsInFrame
// key2は段階によってリストが入る時と文字列が入る時があるから注意
let outputObj = {}; // 出力する連想配列

// 対応関係
let unconnectedTexts; // どのコマとも対応していないテキストを入れる配列

// クラス
const BoxObj = function (rectDict) {
	this.box = new Konva.Rect(rectDict);
	this.isSelected = false;
};

// 読み順クラス(OrderClass)
const OrderClass = function () {
	// 変数の初期化
	this.initValues = () => {
		annotation = [];
		doneCounter = 0;
		isClicked = false;
		key1 = "";
		key2 = [];
	};
	// 初期描画と同じ描画(多分returnDisplayと似たことをやると思う)
	this.initDrawSetting = (boxItem) => {
		boxItem.box.stroke("rgba(" + this.strokeColor + ", 1" + ")");
		boxItem.box.strokeWidth(3);
		boxItem.box.fill("rgba(" + green + ", 0" + ")");
		boxLayer.draw();
	};
	// key1とkey2とisClickedを初期化
	this.resetKeyStatus = () => {
		key1 = "";
		key2 = [];
		isClicked = false;
	};
	// annotationをoutputObjに入れる
	this.finishProcess = () => {
		outputObj[this.processName] = annotation;
	};
	// イベント処理
	this.onMouseup = (actionedItem, event) => {
		if (isClicked == false) {
			if (actionedItem.isSelected == false) {
				this.mouseupValues1(actionedItem, event);
				this.mouseupDraw1(actionedItem);
				if (doneCounter != boxItems.length) {
					cssColor("return button", "white-button");
					cssColor("choose-next", "green-mode-button");
				} else {
					cssColor("finish-button", "yellow-finish-button");
				}
			}
		} else {
			if (event.currentTarget.attrs.id != key1) {
				this.mouseupValues2(actionedItem, event);
				this.mouseupDraw2(actionedItem);
			}
		}
	};
	this.onMouseover = (actionedItem, event) => {
		if (isClicked == false) {
			if (actionedItem.isSelected == false) {
				mouseoverDraw(actionedItem, this.strokeColor, green);
			}
		} else {
			if (
				event.currentTarget.attrs.id != key1 &&
				key2.indexOf(event.currentTarget.attrs.id) == -1
			) {
				mouseoverDraw(actionedItem, this.strokeColor, yellow);
			}
		}
	};
	this.onMouseout = (actionedItem, event) => {
		if (isClicked == false) {
			if (actionedItem.isSelected == false) {
				mouseoutDraw(actionedItem, this.strokeColor, green);
			}
		} else {
			if (
				event.currentTarget.attrs.id != key1 &&
				key2.indexOf(event.currentTarget.attrs.id) == -1
			) {
				mouseoutDraw(actionedItem, this.strokeColor, yellow);
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
	this.mouseupValues2 = (_actionedItem, event) => {
		key2.push(event.currentTarget.attrs.id);
	};
	// アノテータの動き1の描画の処理
	this.mouseupDraw1 = (actionedItem) => {
		boxItems.forEach((item) => {
			if (actionedItem != item) {
				item.box.stroke("rgba(" + this.strokeColor + ", 1" + ")");
				item.box.strokeWidth(3);
				item.box.fill("rgba(" + green + ", 0" + ")");
			} else {
				actionedItem.box.stroke("rgba(" + this.strokeColor + ", 1" + ")");
				actionedItem.box.strokeWidth(6);
				actionedItem.box.fill("rgba(" + green + ", 0.5" + ")");
			}
		});
		boxLayer.draw();
	};
	// アノテータの動き2の描画の処理
	this.mouseupDraw2 = (actionedItem) => {
		actionedItem.box.stroke("rgba(" + this.strokeColor + ", 1" + ")");
		actionedItem.box.strokeWidth(6);
		actionedItem.box.fill("rgba(" + yellow + ", 0.5" + ")");
		boxLayer.draw();
	};
};

// コマ順クラス(読み順クラスを継承)(FramesOrderClass)
const FramesOrderClass = function () {
	OrderClass.call(this); // 継承する文
	this.strokeColor = green;
	this.processName = "framesOrder";
	this.processKey1 = "currentFrame";
	this.processKey2 = "nextFrame";
	// boxItemsを初期化してからboxのインスタンスのリストを作成(何のboxを作るかが違う)
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(frameData, "frame", green, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化(previous-processの色が違う)
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssGray("previous-process", "yellow-process-button");
		cssGray("next-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("次の基準を選択");
		$("#finish-button").html("この段階を終了");
		changeExplanation(
			"第一段階：コマの読み順",
			"<li>アノテーションしていないコマのうち、基準とする任意のコマを選択します。</li>\
			<li>基準のコマの次に読むコマを全て選択します。</li>\
			<li>選択し終えたら[次の基準を選択]を押します。</li>\
			<li>表示されているページの全コマのアノテーションが終了したら[この段階を終了]を押します。</li>\
			<li>[次の段階に進む]を押して次の段階に進んでください。</li>"
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
		if (textData.length != 0) {
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
	this.processKey1 = "currentText";
	this.processKey2 = "nextText";
	// boxItemsを初期化してからboxのインスタンスのリストを作成(何のboxを作るかが違う)
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(textData, "text", yellow, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化( previous-processの色が違う)
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssColor("previous-process", "yellow-process-button");
		cssGray("next-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("次の基準を選択");
		changeExplanation(
			"第二段階：テキストの読み順",
			"<li>アノテーションしていないテキストのうち、基準とする任意のテキストを選択します。</li>\
			<li>基準のテキストの次に読むテキストを全て選択します。</li>\
			<li>選択し終えたら[次の基準を選択]を押します。</li>\
			<li>表示されているページの全テキストのアノテーションが終了したら[この段階を終了]を押します。</li>\
			<li>[次の段階に進む]を押して次の段階に進んでください。</li>"
		);
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
		presentProcess = new TextClassificationClass();
		annotationFunc();
	};
};

// 種別クラス(TextClassificationClass)
const TextClassificationClass = function () {
	this.processName = "textClassification";
	this.processKey1 = "textId";
	this.processKey2 = "classification";
	// 変数の初期化
	this.initValues = () => {
		annotation = [];
		doneCounter = 0;
		isClicked = false;
		key1 = "";
		key2 = "";
	};
	// boxItemsを初期化してからboxのインスタンスのリストを作成
	this.makeBoxInstance = () => {
		boxItems = [];
		makeBoxList(textData, "text", yellow, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssColor("previous-process", "yellow-process-button");
		cssGray("next-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("");
		$("#finish-button").html("この段階を終了");
		changeExplanation(
			"第三段階：テキストの種別",
			"<li>アノテーションしていないテキストのうち、任意のテキストを選択します。</li>\
			<li>アラートが表示されるので、選択したテキストの種別を選択してください。</li>\
			<li>表示されているページの全テキストの種別を入力し終えたら[この段階を終了]を押します。</li>\
			<li>[次の段階に進む]を押して次の段階に進んでください。</li>"
		);
		// フォントとボタンのサイズを変更
		let removeFinishButton = "two-lines-button small-button-font";
		let addFinishButton = "a-line-button large-button-font";
		changeClass("finish-button", removeFinishButton, addFinishButton);
	};
	// 初期描画と同じ描画(多分returnDisplayと似たことをやると思う)
	this.initDrawSetting = (boxItem) => {
		boxItem.box.stroke("rgba(" + yellow + ", 1" + ")");
		boxItem.box.strokeWidth(3);
		boxItem.box.fill("rgba(" + yellow + ", 0" + ")");
		boxLayer.draw();
	};
	// key1とkey2を初期化
	this.resetKeyStatus = () => {
		key1 = "";
		key2 = "";
	};
	// annotationをoutputObjに入れる(key名が違う)
	this.finishProcess = () => {
		outputObj[this.processName] = annotation;
	};
	// 前の段階に戻る
	this.goPreviousProcess = () => {
		saved = false;
		resetLayer();
		deleteOutputObj(this.processName);
		presentProcess = new TextsOrderClass();
		deleteOutputObj(presentProcess.processName);
		annotationFunc();
	};
	// 次の段階に進む
	this.goNextProcess = () => {
		resetLayer();
		presentProcess = new ConnectingFrameAndTextClass();
		annotationFunc();
	};

	// イベント処理
	this.onMouseup = (actionedItem, event) => {
		if (actionedItem.isSelected == false) {
			this.mouseupValues1(actionedItem, event);
			this.mouseupDraw1(actionedItem);
			this.confirmClassification(actionedItem, event); // アラート出す
			if (doneCounter != boxItems.length) {
				cssColor("return button", "white-button");
			} else {
				cssColor("finish-button", "yellow-finish-button");
			}
		}
	};
	this.onMouseover = (actionedItem, _event) => {
		if (actionedItem.isSelected == false) {
			mouseoverDraw(actionedItem, yellow, yellow);
		}
	};
	this.onMouseout = (actionedItem, _event) => {
		if (actionedItem.isSelected == false) {
			mouseoutDraw(actionedItem, yellow, yellow);
		}
	};
	// アノテータの動き1の値の処理
	this.mouseupValues1 = (actionedItem, event) => {
		doneCounter++;
		key1 = event.currentTarget.attrs.id;
		actionedItem.isSelected = true;
	};
	// アノテータの動き2の値の処理
	this.mouseupValues2 = (_actionedItem, _event) => {
		addAnnotation(this.processKey1, this.processKey2);
		this.resetKeyStatus();
	};
	// アノテータの動き1の描画の処理
	this.mouseupDraw1 = (actionedItem) => {
		actionedItem.box.stroke("rgba(" + yellow + ", 1" + ")");
		actionedItem.box.strokeWidth(6);
		actionedItem.box.fill("rgba(" + yellow + ", 0.5" + ")");
		boxLayer.draw();
	};
	// アノテータの動き2の描画の処理はredrawBoxを使う

	this.confirmClassification = (actionedItem, event) => {
		let options = {
			title: "種別の選択",
			text: "選択したテキストの種別を選んでください",
			buttons: {
				a: {text: "セリフ", value: "lines"},
				b: {text: "タイトル", value: "title"},
				c: {text: "モノローグ", value: "monolog"},
				d: {text: "状況説明", value: "description"},
				e: {text: "その他", value: "others"},
			}, // 上から順に右から表示される
		};
		swal(options).then((value) => {
			switch (value) {
				case "lines":
					key2 = "セリフ";
					this.mouseupValues2(actionedItem, event);
					break;
				case "title":
					key2 = "タイトル";
					this.mouseupValues2(actionedItem, event);
					break;
				case "monolog":
					key2 = "モノローグ";
					this.mouseupValues2(actionedItem, event);
					break;
				case "description":
					key2 = "状況説明";
					this.mouseupValues2(actionedItem, event);
					break;
				case "others":
					key2 = "その他";
					this.mouseupValues2(actionedItem, event);
					break;
				default:
					// キャンセルされた場合は選択を無効にする
					doneCounter--;
					key1 = "";
					actionedItem.isSelected = false;
					break;
			}
			redrawBox();
		});
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
		makeBoxList(frameData, "frame", green, boxItems);
		makeBoxList(textData, "text", gray, boxItems);
		boxItems = sortBox(boxItems);
	};
	// ボタンの内容と色の初期化
	this.settingHtml = () => {
		// ボタンの色を変える
		cssGray("return button", "white-button");
		cssGray("choose-next", "green-mode-button");
		if (frameData != 0) {
			cssGray("finish-button", "yellow-finish-button");
			cssColor("previous-process", "yellow-process-button");
		} else {
			cssColor("finish-button", "yellow-finish-button");
			cssGray("previous-process", "yellow-process-button");
		}
		cssGray("next-process", "yellow-process-button");
		// 文字を変える
		$("#choose-next").html("次のコマを選択");
		$("#finish-button").html("このページの<br>アノテーションを保存");

		if (frameData.length == 0) {
			changeExplanation(
				"コマが無いページ",
				"<li>[このページのアノテーションを保存]を押します。</li>\
				<li>[次のページ]を押して次のページに進んでください。</li>"
			);
		} else {
			changeExplanation(
				"第四段階：コマとテキストの対応関係",
				"<li>アノテーションしていないコマのうち、基準とする任意のコマを選択します。</li>\
				<li>基準とするコマに所属するテキストを全て選択します。</li>\
				<li>選択し終えたら[次のコマを選択]を押します。</li>\
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
		isClicked = false;
	};
	// annotationをoutputObjに入れる
	this.finishProcess = () => {
		// isSelectedがfalseのテキストをunconnectedTextsに入れる
		boxItems.forEach((item) => {
			if (item.isSelected == false && item.box.name() == "text") {
				unconnectedTexts.push(item.box.id());
			}
		});
		// connected(annotation)をunconnectedTextsと一緒にalignmentに入れる
		outputObj[this.processName] = {connected: annotation, unconnectedTexts: unconnectedTexts};
	};
	// 前の段階に戻る
	this.goPreviousProcess = () => {
		saved = false;
		resetLayer();
		deleteOutputObj(this.processName);
		if (textData.length != 0) {
			// テキストがある場合は種別に戻る
			presentProcess = new TextClassificationClass();
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
					if (doneCounter != frameData.length) {
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
	this.onMouseover = (actionedItem, _event) => {
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
	this.onMouseout = (actionedItem, _event) => {
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
// ページ番号の表示を更新する
const renewPageNumber = () => {
	$("#page-counter").replaceWith(
		'<p id = "page-counter">' + String(pageIndex + 1) + "/" + pages.length + "ページ" + "</p>"
	);
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
				pageIndex = Number(cache);
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
			pageIndex = value - 1;
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
				if (pageIndex < pages.length - 1) {
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
	checkList[pageIndex] = true;
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
this.processName = "alignment";
this.processKey1 = "frameId";
this.processKey2 = "textsInFrame";

const searchArg = (targetId) => {
	let targetArg; // boxItemsの中の何番目にあるのかを代入する変数
	targetArg = boxItems.findIndex((item) => {
		return item.box.id() === targetId;
	});
	return targetArg;
};

const changeIsSelected = (targetKey1, targetKey2) => {
	// key1のisSelectedをfalseにする
	boxItems[searchArg(targetKey1)].isSelected = false;
	if (presentProcess.processName == "alignment") {
		// key2のリストに入っているテキストのisSelectedをfalseにする
		targetKey2.forEach((selectedId) => {
			boxItems[searchArg(selectedId)].isSelected = false;
		});
	}
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
		pageIndex++;
	}
	if (direction == "previous-page") {
		pageIndex--;
	}
	localStorage.setItem(title + "_pageIndex", pageIndex);
	saved = false;
	bgLayer.remove();
	boxLayer.remove();
	main();
};

// テキストの空のアノテーションをoutputObjに入れて対応関係クラスのインスタンスを作成する
const skipTextsAnnotation = () => {
	presentProcess = new TextsOrderClass();
	presentProcess.finishProcess();
	presentProcess = new TextClassificationClass();
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
		item.box.on("mouseover", (e) => {
			presentProcess.onMouseover(item, e);
		});
	});
	boxItems.forEach((item) => {
		item.box.on("mouseout", (e) => {
			presentProcess.onMouseout(item, e);
		});
	});
	// ボタンの内容と色
	presentProcess.settingHtml();
};

// main
let main = () => {
	outputObj = {title: title, index: String(pageIndex)};
	// レイヤーのインスタンスを作成し、背景画像を読み込んで描画する
	bgLayer = new Konva.Layer();
	boxLayer = new Konva.Layer(); //図形などの要素は後で追加する
	imageObj = new Image();

	imageObj.src = imgPath + String(pageIndex).padStart(3, 0) + ".jpg";
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
	// pageIndexページ目の座標データの読み込み
	frameData = pages[pageIndex]["frame"]; // 無いとundefinedが返ってくる
	textData = pages[pageIndex]["text"]; // 無いとundefinedが返ってくる
	if (frameData == undefined) {
		frameData = [];
	}
	if (textData == undefined) {
		textData = [];
	}
	// サイドバーのページ数とページ移動ボタンの色
	renewPageNumber();
	if (pageIndex == 0) {
		cssGray("previous-page", "green-page-button");
	} else {
		cssColor("previous-page", "green-page-button");
	}
	if (pageIndex == pages.length) {
		cssGray("next-page", "green-page-button");
	} else {
		cssColor("next-page", "green-page-button");
	}

	// presentProcessのインスタンスを作成
	presentProcess = new FramesOrderClass();
	// テキストがない場合、次の段階へで、if (textData.length == 0){}でoutputObjにテキスト関係の空のアノテーションを入れた上で対応関係に飛ぶ
	if (frameData.length == 0) {
		// コマが無い場合
		// outputObjにコマ順から種別までの空のアノテーションを入れて対応関係に飛ぶ
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
		if (isClicked == true) {
			changeIsSelected(key1, key2);
		} else {
			changeIsSelected(
				annotation[annotation.length - 1][presentProcess.processKey1],
				annotation[annotation.length - 1][presentProcess.processKey2]
			);
			annotation.pop();
		}
		deleteOutputObj(presentProcess.processName);
		presentProcess.resetKeyStatus();
		redrawBox(); // boxの描画
		// ボタンの色の処理
		cssGray("choose-next", "green-mode-button");
		cssGray("finish-button", "yellow-finish-button");
		cssGray("next-process", "yellow-process-button");
		if (annotation.length == 0) {
			// annotationの中身が空になったらreturnをグレーに
			cssGray("return button", "white-button");
		}
	}
});

// 次の〇〇を選択
$("#choose-next").on("click", () => {
	// isClickedがtrueだったら
	if (isClicked == true) {
		addAnnotation(presentProcess.processKey1, presentProcess.processKey2); // annotationにkey1とkey2を入れる
		presentProcess.resetKeyStatus(); // key1とkey2とisClickedを初期化(種別はisClicked無し)
		redrawBox(); // boxの表示を更新
		cssGray("choose-next", "green-mode-button");
	}
});

// finish-button
$("#finish-button").on("click", () => {
	if (outputObj[presentProcess.processName] == undefined) {
		if (presentProcess.processName != "alignment") {
			// [この段階を終了]
			// doneCounterがboxItems.lengthと同じだったら(全boxが選択済みだったら)
			if (doneCounter == boxItems.length) {
				if (annotation.length != doneCounter) {
					addAnnotation(presentProcess.processKey1, presentProcess.processKey2); // annotationにkey1とkey2を入れる
				}
				presentProcess.finishProcess(); // annotationをoutputObjに入れる
				presentProcess.resetKeyStatus(); // key1とkey2とisClickedを初期化(種別はisClicked無し)
				redrawBox(); // boxの表示を更新
				// [次の段階へ]をカラーにする
				cssColor("next-process", "yellow-process-button");
				// このボタンをグレーにする
				cssGray("finish-button", "yellow-finish-button");
			}
		} else {
			// [このページのアノテーションを保存]
			// 全frameが選択済みだったら
			if (doneCounter == frameData.length) {
				if (annotation.length != doneCounter) {
					addAnnotation(presentProcess.processKey1, presentProcess.processKey2); // annotationにkey1とkey2を入れる
				}
				presentProcess.finishProcess();
				presentProcess.resetKeyStatus();
				// JSONに変換して書き出し
				outputJsonFile(outputObj, title + String(pageIndex).padStart(3, 0));
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
	if (frameData.length != 0 && presentProcess.processName != "framesOrder") {
		// アノテーションした結果がリセットされるけど良い？というアラートを出して、OKと言われたら実行
		confirmPreviousProcess(
			"前の段階に戻る",
			"この段階とその前の段階のアノテーション結果がリセットされますがよろしいですか？",
			presentProcess.goPreviousProcess // コマ順の場合は空
		);
	}
});

// 次の段階に進む
$("#next-process").on("click", () => {
	// annotation.lengthがkey1のboxオブジェクトの数と同じだったら
	if (annotation.length == boxItems.length) {
		presentProcess.goNextProcess(); // 対応関係の場合は空
	}
});

// 次のページに進む
$("#next-page").on("click", () => {
	if (saved == true) {
		// このページのアノテーションが保存されている
		if (pageIndex < pages.length - 1) {
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
	if (pageIndex >= 1) {
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
