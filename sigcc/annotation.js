// 定数
const sizeDown = 0.56;
const gray = [150, 150, 150];
const black = [0, 0, 0];
const white = [255, 255, 255];
const frameRgb = [0, 153, 51];
const textRgb = [255, 204, 0];

const title = coordinateData["title"];
const pages = coordinateData["pages"];

const imgPath = "../" + title + "/" + title + "/";

// フラグ
let isClicked = false; //コマが選択されているか否か
let saved = false; // このページのアノテーションが保存されているか否か

// カウンタ
let frameCounter = 0; // このページの何番目に読むコマなのかを表示するためのカウンタ
let pageIndex = 0;

// 各ページの座標データ
let frameData = []; //コマの座標データ
let textData = []; //セリフの座標データ

// 各ページのオブジェクト
let boxItems = [];

// 表示に関する変数
let bgImage;
let layer;
let boxGroup;
let orderGroup;

// アノテーションに関する変数
let frameAnnotation = -1; // 現在選択されているコマのID
let linesAnnotation = []; // 現在選択されているコマに属するセリフのIDを読む順に入れる配列
let annotation = []; // このページの読み順を入れる配列
let unannotatedLines = []; // アノテーションされていないセリフを入れる配列
let outputObj = {}; // 出力する連想配列

// クラス
const BoxObj = function (inputRectDict, inputTextDict) {
	this.box = new Konva.Rect(inputRectDict);
	this.order = new Konva.Text(inputTextDict);
	this.isSelected = false;
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

	const newBox = new BoxObj(
		{
			x: xmin, //配置場所
			y: ymin, //配置場所
			width: w, //横幅
			height: h, //高さ
			stroke: "rgba(" + rgb + ", 1" + ")", //枠線の色
			strokeWidth: 3, //枠線の太さ
			name: objName, //HTML要素でいうところのclass
			id: xy["id"], //HTML要素でいうところのid
		},
		{
			x: (xmin + xmax) / 2 - 17, //配置場所
			y: (ymin + ymax) / 2 - 15, //配置場所
			width: 35, //表示される範囲の横幅
			height: 30, //表示される範囲の高さ
			text: "88",
			fontSize: 30,
			fontStyle: "bold",
			align: "center",
			stroke: "rgba(" + white + ", 0" + ")",
			strokeWidth: 1, //枠線の太さ
			fill: "rgba(" + black + ", 0" + ")",
			name: objName, //HTML要素でいうところのclass
			id: xy["id"], //HTML要素でいうところのid
		}
	);
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

// 今選択しているコマのアノテーションをannotationに代入
const addAnnotation = () => {
	// 1コマ分のアノテーション(id)を出力用オブジェクト(annotation)に入れる。
	annotation.push({frameId: frameAnnotation, linesInFrame: linesAnnotation.concat()});
	returnDisplay();
	restoreStatus();
	cssGray("change-mode", "green-mode-button");
};

// コマの選択からやりなおす時のisSelectedの処理
// (と、そのついでにアノテーション順を非表示に変更)
const changeIsSelected = (targetFrameId, targetLineId) => {
	let targetId = [targetFrameId];
	let targetArg;
	targetId = targetId.concat(targetLineId);
	// targetIdというリストにアノテーションされたboxのidを入れる
	targetId.forEach((selectedId) => {
		// targetIdの中身を一つ一つselectedIdに入れる
		targetArg = boxItems.findIndex((item) => {
			return item.box.id() === selectedId;
		});
		// selectedIdがboxItemsのどこにあるのかを探してtargetArgに代入
		boxItems[targetArg].isSelected = false;
		boxItems[targetArg].order.text("00");
		boxItems[targetArg].order.stroke("rgba(" + white + ", 0" + ")");
		boxItems[targetArg].order.fill("rgba(" + black + ", 0" + ")");
	});
};

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

// confirmのsweetalert.jsバージョン
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
			goOtherPage(direction);
		}
	});
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

// [このページのアノテーションを終了]を押したときの基本処理
const finishAnnotation = () => {
	outputObj = {title: title, index: String(pageIndex), annotation, unannotatedLines};
	outputJsonFile(outputObj, title + String(pageIndex).padStart(3, 0));
	saved = true;
	updateCheckList();
};

// ページを移動する
const goOtherPage = (direction) => {
	if (direction == "next-page") {
		pageIndex++;
	}
	if (direction == "previous-page") {
		pageIndex--;
	}
	localStorage.setItem(title + "PageIndex", pageIndex);
	boxItems.length = 0;
	layer.remove();
	restoreStatus();
	resetAnnotation();
	main();
};

// ページのアノテーションが保存されたか否かをチェックするリストを確認し、アノテーションが保存されていないページ番号をリストにして返す
const lookUnannotatedPages = () => {
	let checkList = localStorage.getItem(title + "isAnnotatedCheck");
	checkList = JSON.parse(checkList);
	let unannotatedArg = [];
	for (let i = 0; i < checkList.length; i++) {
		if (checkList[i] == false) {
			unannotatedArg.push(String(i + 1));
		}
	}
	return unannotatedArg;
};

// ページのアノテーションが保存されたか否かをチェックするリストを作成
const makeCheckList = () => {
	let checkList = [];
	for (let i = 0; i < pages.length; i++) {
		checkList.push(false);
	}
	localStorage.setItem(title + "isAnnotatedCheck", JSON.stringify(checkList));
};

const movePageButton = (direction) => {
	if (annotation.length == frameData.length) {
		// 全コマのアノテーションが終了していたら
		if (saved == true) {
			// このページのアノテーションが保存されていたら
			goOtherPage(direction);
		} else {
			// このページのアノテーションが保存されていなかったら
			confirmNotSave(direction, "データが保存されていません", "このまま移動しますか？");
		}
	} else {
		// 全コマのアノテーションが終了していなかったら
		confirmNotSave(
			direction,
			"アノテーションが終わっていません",
			"データは保存されませんがこのまま移動しますか？"
		);
	}
};

// オブジェクトのマウスアウト時の表示変化
const onMouseout = (boxItem, rgb) => {
	boxItem.box.fill("rgba(" + rgb + ", 0" + ")");
	boxItem.box.stroke("rgba(" + rgb + ", 1" + ")");
	layer.draw();
};

// オブジェクトのマウスオーバー時の表示変化
const onMouseover = (boxItem, rgb) => {
	boxItem.box.fill("rgba(" + rgb + ", 0.3" + ")");
	boxItem.box.stroke("rgba(" + rgb + ", 0.5" + ")");
	layer.draw();
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

// ページ番号の表示を更新する
const renewPageNumber = () => {
	$("#page-counter").replaceWith(
		'<p id = "pageCounter">' + String(pageIndex + 1) + "/" + pages.length + "ページ" + "</p>"
	);
};

// このページのアノテーションが一つもされていない状態のリストとカウンタにする
const resetAnnotation = () => {
	saved = false;
	annotation.length = 0;
	frameCounter = 0;
};

// boxの表示を初期状態に戻す
const resetDisplay = () => {
	boxItems.forEach((item) => {
		item.isSelected = false;
		item.box.fill("rgba(" + gray + ", 0" + ")");
		item.box.strokeWidth(3);
		item.order.text("00");
		item.order.stroke("rgba(" + white + ", 0" + ")");
		item.order.fill("rgba(" + black + ", 0" + ")");
		if (item.box.name() == "frame") {
			item.box.stroke("rgba(" + frameRgb + ", 1" + ")");
		}
		if (item.box.name() == "text") {
			item.box.stroke("rgba(" + gray + ", 1" + ")");
		}
	});
	layer.draw();
};

// コマやセリフを選択していない状態のリストとフラグにする
const restoreStatus = () => {
	isClicked = false;
	frameAnnotation = -1;
	linesAnnotation.length = 0;
};

// boxの表示をコマを選択する前の状態に戻す
const returnDisplay = () => {
	boxItems.forEach((item) => {
		item.box.strokeWidth(3);
		if (item.box.name() == "frame") {
			if (item.isSelected == false) {
				item.box.stroke("rgba(" + frameRgb + ", 1" + ")");
				item.box.fill("rgba(" + frameRgb + ", 0" + ")");
			} else {
				item.box.stroke("rgba(" + gray + ", 1" + ")");
				item.box.fill("rgba(" + gray + ", 0.5" + ")");
				item.order.stroke("rgba(" + white + ", 1" + ")");
				item.order.fill("rgba(" + black + ", 1" + ")");
			}
		}
		if (item.box.name() == "text") {
			if (item.isSelected == false) {
				item.box.stroke("rgba(" + gray + ", 1" + ")");
				item.box.fill("rgba(" + textRgb + ", 0" + ")");
			} else {
				item.box.stroke("rgba(" + gray + ", 0.6" + ")");
				item.box.fill("rgba(" + gray + ", 0.5" + ")");
				item.order.stroke("rgba(" + black + ", 1" + ")");
				item.order.fill("rgba(" + white + ", 1" + ")");
				item.order.fontStyle("italic bold");
			}
		}
	});
	layer.draw();
};

// アノテーションされていないセリフのリストを返す
const searchUnannotated = () => {
	let unannotatedId = [];
	boxItems.forEach((item) => {
		if (item.isSelected == false) {
			unannotatedId.push(item.box.id());
		}
	});
	return unannotatedId;
};

// コマが選択された時の表示変更
const selectFrame = (itemToChange) => {
	boxItems.forEach((item) => {
		if (item.box.name() == "frame") {
			item.box.stroke("rgba(" + gray + ", 1" + ")");
		}
		if (item.box.name() == "text") {
			if (item.isSelected == false) {
				item.box.stroke("rgba(" + textRgb + ", 1" + ")");
			}
		}
	});
	itemToChange.stroke("rgba(" + frameRgb + ", 1" + ")");
	itemToChange.strokeWidth(6);
	layer.draw();
};

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

// ページのアノテーションが保存されたか否かをチェックするリストを更新
const updateCheckList = () => {
	let checkList = localStorage.getItem(title + "isAnnotatedCheck");
	checkList = JSON.parse(checkList);
	checkList[pageIndex] = true;
	localStorage.setItem(title + "isAnnotatedCheck", JSON.stringify(checkList));
};

// ------------------------------main start------------------------------
let main = () => {
	// 表示関係のインスタンスを作成
	layer = new Konva.Layer(); //図形などの要素は後で追加する
	boxGroup = new Konva.Group({x: 0, y: 0});
	orderGroup = new Konva.Group({x: 0, y: 0});

	let imageObj = new Image(); // 漫画の画像を読み込むためのインスタンス

	// pageIndexページ目の座標データの読み込み
	frameData = pages[pageIndex]["frame"]; // 無いとundefinedが返ってくる
	textData = pages[pageIndex]["text"]; // 無いとundefinedが返ってくる
	if (frameData == undefined) {
		frameData = [];
	}
	if (textData == undefined) {
		textData = [];
	}

	// boxのインスタンスのリスト(boxItems)を作成
	makeBoxList(frameData, "frame", frameRgb, boxItems);
	makeBoxList(textData, "text", gray, boxItems);

	boxItems = sortBox(boxItems);

	// 背景の設定と、背景とboxの描画
	imageObj.src = imgPath + String(pageIndex).padStart(3, 0) + ".jpg";
	imageObj.onload = function () {
		bgImage = new Konva.Image({
			x: 0,
			y: 0,
			image: imageObj,
			width: 1654 * sizeDown,
			height: 1170 * sizeDown,
		});

		boxItems.forEach((item) => {
			boxGroup.add(item.box);
			orderGroup.add(item.order);
		});

		layer.add(bgImage, orderGroup, boxGroup);
		stage.add(layer);
		layer.draw();
	};

	// イベント処理
	boxItems.forEach((item) => {
		if (item.box.name() == "frame") {
			item.box.on("mouseup", (e) => {
				if (isClicked == false && item.isSelected == false) {
					frameAnnotation = e.currentTarget.attrs.id;
					isClicked = true;
					item.isSelected = true;
					frameCounter++;
					item.order.text(frameCounter);
					selectFrame(item.box);
					cssColor("start-over", "white-button");
					cssColor("to-return", "white-button");
					if (annotation.length == frameData.length - 1) {
						cssColor("finish-annotation", "yellow-button");
					} else {
						cssColor("change-mode", "green-mode-button");
					}
				}
			});

			item.box.on("mouseover", () => {
				if (isClicked == false && item.isSelected == false) {
					onMouseover(item, frameRgb);
				}
			});
			item.box.on("mouseout", () => {
				if (isClicked == false && item.isSelected == false) {
					onMouseout(item, frameRgb);
				}
			});
		}

		if (item.box.name() == "text") {
			item.box.on("mouseup", (e) => {
				if (isClicked && item.isSelected == false) {
					linesAnnotation.push(e.currentTarget.attrs.id);
					item.isSelected = true;
					item.order.text(linesAnnotation.length);
					item.box.stroke("rgba(" + textRgb + ", 1" + ")");
					item.box.strokeWidth(6);
					layer.draw();
				} else if (isClicked && item.isSelected) {
					swal("このセリフは既に選択されています");
				}
			});

			item.box.on("mouseover", () => {
				if (isClicked && item.isSelected == false) {
					onMouseover(item, textRgb);
				}
			});
			item.box.on("mouseout", () => {
				if (isClicked && item.isSelected == false) {
					onMouseout(item, textRgb);
				}
			});
		}
	});

	// canvasの外側の表示
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

	cssGray("start-over", "white-button");
	cssGray("to-return", "white-button");
	cssGray("change-mode", "green-mode-button");

	if (frameData.length == 0) {
		cssColor("finish-annotation", "yellow-button");
	} else {
		cssGray("finish-annotation", "yellow-button");
	}
};
// ------------------------------main end------------------------------

// ステージ、レイヤー、グループのインスタンスを作成
const stage = new Konva.Stage({
	container: "canvas", // 親要素のdivタグのidを指定
	width: 1654 * sizeDown, //キャンバスの横幅
	height: 1170 * sizeDown, //キャンバスの高さ
});

// キャッシュを確認してページの記録がある場合は読み込む
let cache = localStorage.getItem(title + "PageIndex");
if (cache != null) {
	confirmContinuation();
} else {
	makeCheckList();
	main();
}

// ボタンの動作
$("#start-over").on("click", () => {
	if (frameAnnotation != -1 || annotation.length != 0) {
		// 何か1つでもアノテーションされていたら
		restoreStatus();
		resetAnnotation();
		resetDisplay();
		cssGray("start-over", "white-button");
		cssGray("to-return", "white-button");
		cssGray("finish-annotation", "yellow-button");
	}
});

$("#to-return").on("click", () => {
	if (isClicked || annotation.length != 0) {
		// 今選択しているコマがあるかannotationに一つでも入っていたら
		// =このボタンが押されて反応した時
		saved = false;
		frameCounter--;
		cssGray("finish-annotation", "yellow-button");
	}
	if (isClicked) {
		// 今選択しているコマがあるとき
		changeIsSelected(frameAnnotation, linesAnnotation);
		restoreStatus();
		returnDisplay();
	} else if (annotation.length != 0) {
		// [次のコマを選択]を押した後
		let returnedFrame = annotation[annotation.length - 1]["frameId"];
		let returnedLines = annotation[annotation.length - 1]["linesInFrame"];
		changeIsSelected(returnedFrame, returnedLines);
		// 最新のアノテーションのオブジェクトのisSelectedをfalseにする
		annotation.pop();
		// annotationから最新のアノテーションを取り除く
		returnDisplay();
	}
	if (isClicked == false && annotation.length == 0) {
		// 処理した結果isClickedがfalseかつannotationが空だったら
		cssGray("start-over", "white-button");
		cssGray("to-return", "white-button");
	}
});

$("#change-mode").on("click", () => {
	if (isClicked) {
		addAnnotation();
	}
});

$("#finish-annotation").on("click", () => {
	if (saved == true) {
		swal("このページのアノテーションは既に保存されています。");
	}
	if (annotation.length == frameData.length - 1 && isClicked == true && saved == false) {
		addAnnotation();
		unannotatedLines = searchUnannotated();
		finishAnnotation();
	} else if (annotation.length == frameData.length && isClicked == false && saved == false) {
		unannotatedLines = searchUnannotated();
		finishAnnotation();
	}
	if (frameData.length == 0 && saved == false) {
		finishAnnotation();
	}
});

$("#next-page").on("click", () => {
	if (pageIndex < pages.length - 1) {
		// 次のページがあったら
		movePageButton("next-page");
	} else {
		// 次のページがなかったら
		let unannotatedPages = lookUnannotatedPages();
		if (unannotatedPages.length == 0) {
			// アノテーションされていないページがなかったら
			swal("この漫画のアノテーションは終了です。お疲れ様でした。");
		} else {
			// アノテーションされていないページがあったら
			let unannotatedMessage = "";
			unannotatedPages.forEach((item) => {
				unannotatedMessage = unannotatedMessage + "\n" + item + "ページ";
			});
			swal(
				"アノテーションされていないページがあります。下記のページを確認してください。" +
					unannotatedMessage
			);
		}
	}
});

$("#previous-page").on("click", () => {
	if (pageIndex >= 1) {
		// 前のページがあったら
		movePageButton("previous-page");
	}
});
