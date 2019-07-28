/**************************** 변수 선언 ****************************/
var rABS = true; // T : 바이너리, F : 어레이 버퍼
var searchjuso = 0;
var markOverlay = [];
//var cellidentify = [];
var aColumn = [];
var bColumn = [];
var cColumn = [];
var jusoNotFound = [];
var coords = [];
var geocoder = new daum.maps.services.Geocoder();
var bounds = new daum.maps.LatLngBounds();
var chkBackground = 0;
var fileClassBoolean = 0;
var mylocationCircle = 0;
var mylocationMark = 0;
var customMarkButtonBackground = 0;
/**************************** 변수 선언 ****************************/

var mapContainer = document.getElementById('map'),
	mapOption = {
		center: new daum.maps.LatLng(37.290212, 127.0094235), // 지도의 중심좌표
		level: 3 // 지도의 확대 레벨
	};

// 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
var map = new daum.maps.Map(mapContainer, mapOption);

// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new daum.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// daum.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, daum.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new daum.maps.ZoomControl();
map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);

// 마커에 표시될 인포윈도우를 생성
var marker = new daum.maps.Marker(),
	infowindow = new daum.maps.InfoWindow({
		zindex: 1
	});

// 지도를 클릭했을 때 클릭 위치 좌표에 대한 주소정보를 표시하도록 이벤트 등록
daum.maps.event.addListener(map, 'click', function(mouseEvent) {
	searchDetailAddrFromCoords(mouseEvent.latLng, function(result, status) {
		if (status === daum.maps.services.Status.OK) {
			var detailAddr = !!result[0].road_address ? '<div>도로명 : ' + result[0].road_address.address_name + '</div>' : '';
			detailAddr += '<div>지번 : ' + result[0].address.address_name + '</div>';
			detailAddr += '위도 : ' + mouseEvent.latLng.getLat() + '\u0020' + '경도 : ' + mouseEvent.latLng.getLng();
			var content = '<div class="bAddr">' + detailAddr + '</div>';
			marker.setPosition(mouseEvent.latLng);
			marker.setMap(map);
			infowindow.setContent(content);
			infowindow.open(map, marker);
		} else {
			detailAddr += '위도 : ' + mouseEvent.latLng.getLat() + '\u0020' + '경도 : ' + mouseEvent.latLng.getLng();
			var content = '<div class="bAddr">' + detailAddr + '</div>';
			marker.setPosition(mouseEvent.latLng);
			marker.setMap(map);
			infowindow.setContent(content);
			infowindow.open(map, marker);
		}
		copy('위도 : ' + mouseEvent.latLng.getLat() + '\u0020' + '경도 : ' + mouseEvent.latLng.getLng());
	});
});
// 좌표로 행정동 주소 정보를 요청하는 함수
function searchAddrFromCoords(coords, callback) {
	geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
}
// 좌표로 법정동 상세 주소 정보를 요청하는 함수
function searchDetailAddrFromCoords(coords, callback) {
	geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
}
//주소 검색 함수
function searchAddress() {
	var temp = document.getElementById("inputAddress").value;
	var tempCoords = 0;
	searchjuso = temp;
	geocoder.addressSearch(searchjuso, function(result, status) {
		if (status === daum.maps.services.Status.OK) {
			tempCoords = new daum.maps.LatLng(result[0].y, result[0].x);
			if (tempCoords != null) {
				marker.setPosition(tempCoords);
				marker.setMap(map);
				map.setCenter(tempCoords);
				map.setLevel(3);
			}
		} else {
			alert("주소 검색 실패");
		}
	});
}

//엑셀 로드 함수
function fixdata(data) {
	var o = "",
		l = 0,
		w = 10240;
	for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
	o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
	return o;
}

function getConvertDataToBin($data) {
	var arraybuffer = $data;
	var data = new Uint8Array(arraybuffer);
	var arr = new Array();
	for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
	var bstr = arr.join("");

	return bstr;
}

function handleFile(e) {
	document.getElementById('endHidden').style.display = 'none';
	var files = e.target.files;
	var i, f;
	for (i = 0; i != files.length; ++i) {
		f = files[i];
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function(e) {
			var data = e.target.result;
			var workbook;
			if (rABS) {
				/* if binary string, read with type 'binary' */
				workbook = XLSX.read(data, {
					type: 'binary'
				});
			} else {
				/* if array buffer, convert to base64 */
				var arr = fixdata(data);
				workbook = XLSX.read(btoa(arr), {
					type: 'base64'
				});
			} //end. if

			/* 워크북 처리 */
			workbook.SheetNames.forEach(function(item, index, array) {
				// CSV
				var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[item]); // default : ","
				// json
				var json = XLSX.utils.sheet_to_json(workbook.Sheets[item]);
				var worksheet = workbook.Sheets[item];
				var range = XLSX.utils.decode_range(worksheet['!ref']);
				for (var j = 1; range.e.r+2 >= j; j++) {
					aColumn[j] = (worksheet["A" + j] ? worksheet["A" + j].v : undefined);
					bColumn[j] = (worksheet["B" + j] ? worksheet["B" + j].v : undefined);
					cColumn[j] = (worksheet["C" + j] ? worksheet["C" + j].v : undefined);
				}

				if (fileClassBoolean == 0){
					var notFoundCount = 0;
					aColumn.forEach(function(addr, index) {
						geocoder.addressSearch(addr, function(result, status) {
							if (status === daum.maps.services.Status.OK) {
								coords[index] = new daum.maps.LatLng(result[0].y, result[0].x);
								if (coords[index] != null) {
									if (bColumn[index] == undefined) {bColumn[index] = "V";}
									var tempContent = '<button type="button" class = "customMarkButton" id="tempId" onclick="closeOverlay(this.id)">' + bColumn[index] + '</button>';
									//커스텀오버레이 생성
									markOverlay[index] = new daum.maps.CustomOverlay({
										map: map,
										clickable: true,
										position: coords[index],
										content: tempContent
									});
									bounds.extend(coords[index]);
									map.setBounds(bounds);

									var tempElement = document.getElementById("tempId");
									//카테고리별 색 지정
									switch (cColumn[index]) {
										case '일반주택':
										case '상가주택':
											{
												tempElement.style.color = "green";
												break;
											}
										case '농사용':
											{
												tempElement.style.color = "gold";
												break;
											}
										case '휴게음식점':
										case '일반음식점':
											{
												tempElement.style.color = "purple";
												break;
											}
										case '노래연습장업':
										case '기타주점':
										case '유흥주점':
										case '단란주점':
											{
												tempElement.style.color = "red";
												break;
											}
										case '이동통신 중계기':
											{
												tempElement.style.color = "blue";
												break;
											}
										case '광업':
										case '하수폐기청소업':
										case '제조업':
											{
												tempElement.style.color = "brown";
												break;
											}
										default:
											tempElement.style.color = "black";
									}
									//커스텀오버레이 ID 부여
									document.getElementById("tempId").setAttribute('id', index);
								}
							} else {
								//주소 검색 불가 시 데이터 저장
                if (aColumn[index]) {
                  jusoNotFound[notFoundCount++] = aColumn[index];
                }
								var tempDiv = document.getElementById('chkNotFound');
								tempDiv.style.display = 'block';
							}
						});
					});
				} else {
					aColumn.forEach(function(addr, index) {
						var tempCoords = new kakao.maps.LatLng(bColumn[index], cColumn[index]);
						var tempContent = '<button type="button" class = "customMarkButton" id="tempId" onclick="closeOverlay(this.id)">' + aColumn[index] + '</button>';
						//커스텀오버레이 생성
						markOverlay[index] = new daum.maps.CustomOverlay({
							map: map,
							clickable: true,
							position: tempCoords,
							content: tempContent
						});
						bounds.extend(tempCoords);
						map.setBounds(bounds);
						//커스텀오버레이 ID 부여
						document.getElementById("tempId").setAttribute('id', index);
					});
					//changecss('.customMarkButton', 'background', 'transparent');
					changecss('.customMarkButton', 'border-radius', '50%');
					changecss('.customMarkButton', 'width', '20px');
					changecss('.customMarkButton', 'height', '20px');
					changecss('.customMarkButton', 'font-weight', 'bold');
				}
			}); //end. forEach
		}; //end onload
		if (rABS) reader.readAsBinaryString(f);
		else reader.readAsArrayBuffer(f);
    var tempDiv = document.getElementById('noneBackgroundMenu');
    tempDiv.style.display = 'block';
	} //end. for
}

var input_dom_element;
$(function() {
	input_dom_element = document.getElementById('my_file_input');
	if (input_dom_element.addEventListener) {
		input_dom_element.addEventListener('change', handleFile, false);
	}
});

function fileClass(e) {
	fileClassBoolean = e;
}

//검색 실패 항목 표시하는 함수
function alertNotFound() {
	var alertNotFoundString = jusoNotFound.join("<br>");
	document.getElementById("alertTitle").innerHTML = "검색 실패 항목";
	document.getElementById("alertContent").innerHTML = alertNotFoundString;
	goDetail()
}

//글자 배경 없애는 함수
function noneBackground() {
  if (customMarkButtonBackground == 0) {
    changecss('.customMarkButton', 'background', 'transparent');
    customMarkButtonBackground = 1;
  } else {
    changecss('.customMarkButton', 'background', 'white');
    customMarkButtonBackground = 0;
  }
}

//설명서 표시하는 함수
function alertHelp() {
	var alertHelpString =     "-----Address Excel-----"+"<br>";
			alertHelpString +=    "A열 : 검색 주소 값"+"<br>";
			alertHelpString +=    "B열 : 표시 값"+"<br>";
			alertHelpString +=    "C열 : Category2"+"<br>";
			alertHelpString +=    "ex) : A열 : 영화동 338-1, B열 : 338-1, C열 : 일반주택"+"<br>";
			alertHelpString +=    "<br>";
			alertHelpString +=    "-----GPS Excel-----"+"<br>";
			alertHelpString +=    "A열 : No."+"<br>";
			alertHelpString +=    "B열 : 위도"+"<br>";
			alertHelpString +=    "C열 : 경도"+"<br>";
			alertHelpString +=    "ex) : A열 : 0, B열 : 37.290208, C열 : 127.011734"+"<br>";
			alertHelpString +=    "<br>";
			alertHelpString +=    "-----추가 기능-----"+"<br>";
			alertHelpString +=    "지도 클릭시 위도,경도 자동 복사"+"<br>";
			alertHelpString +=    "내 위치 및 오차 반경 표시"+"<br>";
	document.getElementById("alertTitle").innerHTML = "사용 설명서";
	document.getElementById("alertContent").innerHTML = alertHelpString;
	goDetail()
}

//클립보드로 복사 하는 함수
function copy(val) {
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = val;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
}

//커스텀오버레이 안보이게 하는 함수
function closeOverlay(clicked_id) {
	var tempId = clicked_id;
	var tempOverlay = markOverlay[tempId];
	tempOverlay.setVisible(false);
}

//레이어 팝업 기능
function wrapWindowByMask() {
	//화면의 높이와 너비를 구한다.
	var maskHeight = $(document).height();
	var maskWidth = $(window).width();

	//문서영역의 크기
	console.log("document 사이즈:" + $(document).width() + "*" + $(document).height());
	//브라우저에서 문서가 보여지는 영역의 크기
	console.log("window 사이즈:" + $(window).width() + "*" + $(window).height());

	//마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다.
	$('#mask').css({
		'width': maskWidth,
		'height': maskHeight
	});

	//애니메이션 효과
	//$('#mask').fadeIn(1000);
	$('#mask').fadeTo("slow", 0.5);
}

function popupOpen() {
	$('.layerpop').css("position", "absolute");
	//영역 가운에데 레이어를 뛰우기 위해 위치 계산
	$('.layerpop').css("top", (($(window).height() - $('.layerpop').outerHeight()) / 2) + $(window).scrollTop());
	$('.layerpop').css("left", (($(window).width() - $('.layerpop').outerWidth()) / 2) + $(window).scrollLeft());
	//$('.layerpop').draggable();
	$('#layerbox').show();
}

function popupClose() {
	$('#layerbox').hide();
	$('#mask').hide();
}

function goDetail() {
	popupOpen(); //레이어 팝업창 오픈
	wrapWindowByMask(); //화면 마스크 효과
}

function success(pos) {
  var crd = pos.coords;

  console.log('Your current position is:');
  console.log('Latitude : ' + crd.latitude);
  console.log('Longitude: ' + crd.longitude);
  console.log('More or less ' + crd.accuracy + ' meters.');

	if(mylocationCircle) {
    mylocationCircle.setMap(null);
    mylocationCircle = null;
  }

	if(mylocationMark) {
		mylocationMark.setMap(null);
		mylocationMark = null;
	}


  mylocationCircle = new kakao.maps.Circle({
      center : new kakao.maps.LatLng(crd.latitude, crd.longitude),  // 원의 중심좌표 입니다
      radius: crd.accuracy, // 미터 단위의 원의 반지름입니다
      strokeWeight: 3, // 선의 두께입니다
      strokeColor: '#75B8FA', // 선의 색깔입니다
      strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
      strokeStyle: 'dashed', // 선의 스타일 입니다
      fillColor: '#CFE7FF', // 채우기 색깔입니다
      fillOpacity: 0.5  // 채우기 불투명도 입니다
  });

	mylocationMark = new kakao.maps.Marker({
	    position: new kakao.maps.LatLng(crd.latitude, crd.longitude)
	});

	mylocationMark.setMap(map);
  // 지도에 원을 표시합니다
  mylocationCircle.setMap(map);

  var moveLatLon = new kakao.maps.LatLng(crd.latitude, crd.longitude);

  // 지도 중심을 부드럽게 이동시킵니다
  // 만약 이동할 거리가 지도 화면보다 크면 부드러운 효과 없이 이동합니다
  map.panTo(moveLatLon);
}

function error(err) {
  console.warn('ERROR(' + err.code + '): ' + err.message);
}

function mylocationMarker() {
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  navigator.geolocation.getCurrentPosition(success, error, options);
}

	/***** Version History *****/
	/*
	Version 01 : Original
	Version 02 : 검색 불가 항목 팝업 추가
							Category_Code2 엑셀 파싱 완료 및 색상별 마킹 추가 중
							소스 정리
	Version 03 : Category_Code2 색상별 마킹 기능 및 색상 목록 추가
							소스 정리
	Version 04 : 지도 클릭 시 위도, 경도 표시 추가
							인터페이스 정리 및 소스 정리
	Version 05 : 지도 클릭 시 마커 및 인포박스 추가
							주소 검색 창 추가
							인터페이스 정리 및 소스 정리
	Version 06 : 커스텀오버레이 숨김 기능 추가 (버튼 형식 변경)
							검색 실패 항목 팝업 변경
							인터페이스 정리 및 소스 정리
	Version 07 : 인터페이스 변경 (메뉴화)
							GPS 주소 파일 검색 기능 추가
							소스 정리
	*/
	// made by Jeong
