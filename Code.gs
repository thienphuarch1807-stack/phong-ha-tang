/**
 * ===========================================================================
 *  BẢNG ĐIỀU HÀNH CÔNG VIỆC — PHÒNG HẠ TẦNG, UBND XÃ ĐÔNG THẠNH
 *  Code.gs  —  phiên bản 1.2 (điện thoại + máy tính, một file Index)
 * ===========================================================================
 *
 *  FILE NÀY THAY THẾ TOÀN BỘ Code.gs CŨ. Xoá hết nội dung Code.gs rồi dán vào.
 *
 *  Dự án Apps Script cần có:
 *     Code.gs          ← file này
 *     Index            ← giao diện mới, tự co giãn máy tính + điện thoại (HTML)
 *     Index_Mobile     ← (tuỳ chọn) bản điện thoại cũ, mở bằng ?v=m
 *  Nếu chưa có file Index, script tự dùng Index_Desktop như trước.
 *
 *  Sau khi dán: Triển khai → Quản lý triển khai → bút chì → Phiên bản mới → Triển khai.
 *
 *  Dùng chung MỘT link triển khai cho cả máy tính và điện thoại:
 *     https://script.google.com/macros/s/.../exec        ← giao diện mới (tự co giãn)
 *     https://script.google.com/macros/s/.../exec?v=m    ← bản điện thoại cũ
 *
 *  Kiểm tra nhanh: chọn hàm  kiemTra  → Chạy → xem Nhật ký thực thi.
 *
 *  CHATBOT AI (tuỳ chọn): lấy khoá miễn phí tại https://aistudio.google.com/apikey
 *  rồi điền vào GEMINI_API_KEY. Để trống thì trợ lý vẫn trả lời theo quy tắc.
 * ===========================================================================
 */

/* ============================================================== CẤU HÌNH */

/** Bảng tính dữ liệu:
 *  https://docs.google.com/spreadsheets/d/1PRp39VmpDB2NdbMbWrzfyQ3sOXCst0qmz1iyhYxFQIE/edit */
var SHEET_ID = '1PRp39VmpDB2NdbMbWrzfyQ3sOXCst0qmz1iyhYxFQIE';

/** Tên bảng tính khi script tự tạo (chỉ dùng khi SHEET_ID để trống). */
var TEN_BANG_TINH = 'Du lieu Bang dieu hanh - Phong Ha tang';

/** Để mảng rỗng = ai mở link cũng sửa được. Điền email để giới hạn người sửa. */
var DANH_SACH_SUA = [];

/** ID thư mục Drive lưu file tải lên. Để trống thì script tự tạo thư mục. */
var THU_MUC_LUU = '';
var TEN_THU_MUC = 'Ho so scan - Phong Ha tang';

/** Số ngày mặc định để tính HẠN TRẢ = NGÀY TIẾP NHẬN + n */
var SO_NGAY_HAN = 5;

/**
 * Văn bản đến: khi cột HẠN XỬ LÝ để trống, script tự tính hạn dự kiến
 * = NGÀY NHẬN + số ngày dưới đây, theo mức độ ở cột TÌNH TRẠNG.
 */
var HAN_THEO_MUC = { 3: 1, 2: 3, 1: 5 };

/** Chatbot AI — để trống nếu không dùng */
var GEMINI_API_KEY = '';
var GEMINI_MODEL = 'gemini-2.5-flash';

var TZ = 'Asia/Ho_Chi_Minh';
var CACHE_TIEN_TO = 'BDH_M1_';
var CACHE_GIAY = 180;

var COT_LINK_HOSO = 'LINK DRIVE';
var COT_NGAY_HOAN_THANH = 'NGÀY HOÀN THÀNH';

/** Mẫu ký hiệu theo loại văn bản */
var MAU_KY_HIEU = {
  'Quyết định':       '......../QĐ-UBND ngày ......../{MM/YYYY}',
  'Quyết định dự án': '......../QĐ-UBND ngày ......../{MM/YYYY}',
  'Công văn':         '......../UBND-HT ngày ......../{MM/YYYY}',
  'Nghị quyết':       '......../NQ-HĐND ngày ......../{MM/YYYY}',
  'Giấy mời':         '......../GM-HT ngày ......../{MM/YYYY}',
  'Thông báo':        '......../TB-HT ngày ......../{MM/YYYY}',
  'Báo cáo':          '......../BC-HT ngày ......../{MM/YYYY}',
  'Tờ trình':         '......../TTr-HT ngày ......../{MM/YYYY}'
};

var MAC_DINH_HOSO = { tinhTrang: 'Tiếp nhận', dangTai: 'Chuyên viên', ketQua: 'Đang thực hiện' };

/* ================================================= CẤU TRÚC SHEET CHUẨN */

var CAU_TRUC = {
  XU_LY_HO_SO: ['SỐ PHIẾU','TÊN NHIỆM VỤ/ CÔNG TÁC','LOẠI VĂN BẢN','KÝ HIỆU','TRÍCH YẾU',
    'NGÀY TIẾP NHẬN','HẠN TRẢ','NGÀY HOÀN THÀNH','TÌNH TRẠNG','ĐANG TẠI','KẾT QUẢ','SỐ LƯỢNG',
    'CƠ QUAN BAN HÀNH','HỘP','KỆ','NGĂN','GHI CHÚ','FILE SCAN','LINK DRIVE','NGÀY CẬP NHẬT'],
  VAN_BAN_DEN: ['SỐ TT','SỐ HIỆU','NGÀY VĂN BẢN','NGÀY NHẬN','HẠN XỬ LÝ','TRÍCH YẾU',
    'TÓM TẮT NỘ DUNG CHÍNH CỦA VĂN BẢN','TÌNH TRẠNG','HOÀN THÀNH','PHÂN LOẠI','FILE SCAN',
    'TÊN FILE','NGÀY CẬP NHẬT'],
  KE_HOACH_TUAN: ['NGAY','BAT_DAU','KET_THUC','TIEU_DE','LOAI','UU_TIEN','NGUON','GHI_CHU','TRANG_THAI'],
  HO_SO_CAP_PHEP: ['CHỦ ĐẦU TƯ','HẠN TRẢ','KẾT QUẢ','NGÀY CẬP NHẬT'],
  LICH: ['Tiêu đề','Thời gian','Địa điểm','Nội dung tóm tắt'],
  LOAI: ['LOAI'],
  PHAN_LOAI: ['PHAN_LOAI'],
  TEN_NHIEM_VU: ['TEN_NHIEM_VU']
};

var DANH_MUC_MAU = {
  LOAI: ['Công văn','Báo cáo','Tờ trình','Thông báo','Quyết định','Quyết định dự án','Giấy mời','Nghị quyết'],
  PHAN_LOAI: ['Quy hoạch','Xây dựng','Đầu tư công','Đất đai','Hạ tầng kỹ thuật','Tài chính','Hành chính'],
  TEN_NHIEM_VU: ['Thẩm định báo cáo kinh tế - kỹ thuật','Rà soát quy hoạch 1/2000',
    'Cung cấp thông tin quy hoạch','Đề xuất lộ giới hẻm','Trả lời đơn của công dân',
    'Tham mưu chủ trương đầu tư','Báo cáo định kỳ']
};

/* ========================================================== KIỂM TRA NHANH */

/** Chạy hàm này trong trình soạn thảo để kiểm tra kết nối bảng tính. */
function kiemTra() {
  var dl = layDuLieu((new Date()).getFullYear(), true);
  if (!dl.ok) { Logger.log('LỖI: ' + dl.loi); return; }
  Logger.log('Kết nối OK — năm ' + dl.nam);
  Logger.log('Hồ sơ năm nay: ' + dl.hoSo.tk.tong + ' · chưa khép (mọi năm): ' + dl.hoSo.canXuLy.length);
  Logger.log('Văn bản đến năm nay: ' + dl.vanBan.tk.tong + ' · cần xử lý: ' + dl.vanBan.tk.canXuLy);
  Logger.log('Lịch: ' + dl.lich.length + ' · Kế hoạch tuần: ' + dl.keHoach.viec.length + ' · Cấp phép: ' + dl.capPhep.length);
  Logger.log('Các năm có dữ liệu: ' + dl.namList.join(', '));
}

/* ========================================================== KHỞI TẠO DỰ ÁN */

/**
 * Chỉ cần khi dùng bảng tính mới. Tạo đủ sheet, đủ tiêu đề cột, danh mục.
 * Chạy lại nhiều lần cũng an toàn: chỉ bổ sung thứ còn thiếu, không xoá dữ liệu.
 */
function khoiTao() {
  var ss = moBangTinh_(true);
  var moi = [];

  Object.keys(CAU_TRUC).forEach(function (ten) {
    var sh = ss.getSheetByName(ten);
    if (!sh) { sh = ss.insertSheet(ten); moi.push(ten); }
    dungTieuDe_(sh, CAU_TRUC[ten]);
  });

  Object.keys(DANH_MUC_MAU).forEach(function (ten) {
    var sh = ss.getSheetByName(ten);
    if (sh.getLastRow() < 2) {
      var v = DANH_MUC_MAU[ten].map(function (x) { return [x]; });
      sh.getRange(2, 1, v.length, 1).setValues(v);
    }
  });

  if (!SHEET_ID && ss.getSheetByName('XU_LY_HO_SO').getLastRow() < 2) themDuLieuMau_(ss);

  if (!SHEET_ID) {
    var td = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');
    if (td && ss.getSheets().length > 1 && td.getLastRow() < 2) ss.deleteSheet(td);
  }

  dinhDangSheet_(ss, moi);
  xoaCache();

  var url = ss.getUrl();
  Logger.log('XONG. Bảng tính: ' + url);
  Logger.log(moi.length ? 'Sheet vừa tạo: ' + moi.join(', ') : 'Các sheet đã có đủ.');
  return url;
}

function banDau_() {
  var props = PropertiesService.getScriptProperties();
  var id = SHEET_ID || props.getProperty('SHEET_ID');
  var can = !id;
  if (!can) {
    try {
      var ss = SpreadsheetApp.openById(id);
      can = !ss.getSheetByName('XU_LY_HO_SO');
    } catch (e) { can = true; }
  }
  if (can) khoiTao();
  return moBangTinh_(false);
}

function moBangTinh_(taoNeuThieu) {
  var props = PropertiesService.getScriptProperties();
  var id = SHEET_ID || props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); }
    catch (e) { if (!taoNeuThieu) throw new Error('Không mở được bảng tính ID ' + id + ' — kiểm tra tài khoản chạy script có quyền xem bảng tính.'); }
  }
  if (!taoNeuThieu) throw new Error('Chưa có bảng tính. Hãy chạy hàm khoiTao một lần.');
  var ss = SpreadsheetApp.create(TEN_BANG_TINH);
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function dungTieuDe_(sh, cot) {
  var n = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, n).getValues()[0].map(function (x) {
    return String(x).replace(/\s+/g, ' ').trim();
  });
  var them = cot.filter(function (c) { return head.indexOf(c) === -1; });
  if (head.join('') === '') {
    sh.getRange(1, 1, 1, cot.length).setValues([cot]);
  } else if (them.length) {
    sh.getRange(1, head.length + 1, 1, them.length).setValues([them]);
  }
  sh.setFrozenRows(1);
}

function dinhDangSheet_(ss, chiCac) {
  var loc = chiCac && chiCac.length ? chiCac : [];
  loc.forEach(function (ten) {
    var sh = ss.getSheetByName(ten);
    if (!sh) return;
    var n = sh.getLastColumn();
    sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#F0622B').setFontColor('#FFFFFF');
    sh.setRowHeight(1, 30);
    if (ten === 'XU_LY_HO_SO') {
      ['NGÀY TIẾP NHẬN','HẠN TRẢ',COT_NGAY_HOAN_THANH].forEach(function (c) {
        var i = viTriCot_(sh, c);
        if (i) sh.getRange(2, i, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('dd/MM/yyyy');
      });
    }
    if (ten === 'LICH') {
      var iTg = viTriCot_(sh, 'Thời gian');
      if (iTg) sh.getRange(2, iTg, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('dd/MM/yyyy HH:mm');
    }
  });
}

function viTriCot_(sh, ten) {
  if (!sh || sh.getLastColumn() < 1) return 0;
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  for (var i = 0; i < head.length; i++)
    if (String(head[i]).replace(/\s+/g, ' ').trim() === ten) return i + 1;
  return 0;
}

function themDuLieuMau_(ss) {
  var nam = (new Date()).getFullYear();
  var ng = function (lech) { var d = new Date(); d.setDate(d.getDate() + lech); return d; };
  var hs = [
    ['01/' + nam + '/PXL', 'Thẩm định báo cáo kinh tế - kỹ thuật', 'Báo cáo',
     '......../BC-HT ngày ......../' + dinhDang(new Date(), 'MM/yyyy'),
     'Thẩm định BCKTKT sửa chữa cơ sở vật chất trường học.', ng(-6), ng(-1), '',
     'Đang xử lý', 'Lãnh đạo Phòng', 'Đang thực hiện', '1 bộ', 'Ban QLDA xã'],
    ['02/' + nam + '/PXL', 'Cung cấp thông tin quy hoạch', 'Công văn',
     '......../UBND-HT ngày ......../' + dinhDang(new Date(), 'MM/yyyy'),
     'Trả lời thông tin ranh quy hoạch đối với thửa đất của hộ dân.', ng(-3), ng(2), '',
     'Tiếp nhận', 'Chuyên viên', 'Đang thực hiện', '1 bộ', 'Hộ dân'],
    ['03/' + nam + '/PXL', 'Báo cáo định kỳ', 'Báo cáo',
     '......../BC-HT ngày ......../' + dinhDang(new Date(), 'MM/yyyy'),
     'Báo cáo tình hình thực hiện công tác quản lý hạ tầng.', ng(-14), ng(-9), ng(-10),
     'Đã phát hành', 'Văn thư', 'Hoàn thành', '2 bộ', 'UBND xã Đông Thạnh']
  ];
  ghiHang_(ss.getSheetByName('XU_LY_HO_SO'),
    ['SỐ PHIẾU','TÊN NHIỆM VỤ/ CÔNG TÁC','LOẠI VĂN BẢN','KÝ HIỆU','TRÍCH YẾU','NGÀY TIẾP NHẬN',
     'HẠN TRẢ',COT_NGAY_HOAN_THANH,'TÌNH TRẠNG','ĐANG TẠI','KẾT QUẢ','SỐ LƯỢNG','CƠ QUAN BAN HÀNH'], hs);

  ghiHang_(ss.getSheetByName('VAN_BAN_DEN'),
    ['SỐ TT','SỐ HIỆU','NGÀY VĂN BẢN','NGÀY NHẬN','TRÍCH YẾU','TÌNH TRẠNG','HOÀN THÀNH','PHÂN LOẠI'],
    [['1', '0000/SQHKT-QHKV2', ng(-8), ng(-4), 'Lấy ý kiến đồ án quy hoạch chung.',
      'BÁO CÁO CÓ THỜI HẠN', 'ĐANG THỰC HIỆN', 'Quy hoạch']]);

  ghiHang_(ss.getSheetByName('LICH'), ['Tiêu đề','Thời gian','Địa điểm','Nội dung tóm tắt'],
    [['Họp giao ban Phòng Hạ tầng', ng(1), 'Phòng họp UBND xã', 'Rà soát tiến độ hồ sơ trong tuần.']]);

  ghiHang_(ss.getSheetByName('KE_HOACH_TUAN'),
    ['NGAY','BAT_DAU','KET_THUC','TIEU_DE','LOAI','UU_TIEN','GHI_CHU'],
    [[ng(0), '08:00', '09:30', 'Kiểm tra hiện trạng tuyến hẻm', 'Hiện trường', 'Cao',
      'Đo đạc, chụp ảnh hiện trạng phục vụ đề xuất lộ giới.']]);

  ghiHang_(ss.getSheetByName('HO_SO_CAP_PHEP'), ['CHỦ ĐẦU TƯ','HẠN TRẢ','KẾT QUẢ','NGÀY CẬP NHẬT'],
    [['Nguyễn Văn A', ng(3), 'Đang xử lý', new Date()]]);
}

function ghiHang_(sh, cot, hang) {
  if (!sh || !hang.length) return;
  var n = sh.getLastColumn();
  var idx = {};
  sh.getRange(1, 1, 1, n).getValues()[0].forEach(function (t, i) {
    var k = String(t).replace(/\s+/g, ' ').trim(); if (k && idx[k] === undefined) idx[k] = i;
  });
  var ra = hang.map(function (h) {
    var d = new Array(n).fill('');
    cot.forEach(function (c, i) { if (idx[c] !== undefined) d[idx[c]] = h[i]; });
    return d;
  });
  sh.getRange(sh.getLastRow() + 1, 1, ra.length, n).setValues(ra);
}

function moBangTinhDuLieu() {
  var url = moBangTinh_(false).getUrl();
  Logger.log(url);
  return url;
}

/* ================================================================ WEB APP */

/**
 * Giao diện mới (file Index — kính mờ, tự co giãn máy tính và điện thoại) là mặc định.
 * Nếu dự án chưa có file Index thì dùng Index_Desktop.
 * Thêm ?v=m vào cuối link để mở bản điện thoại cũ (Index_Mobile).
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var v = String(p.v || '').toLowerCase();
  var cu = ['m', 'mobile', 'cu', 'old'].indexOf(v) !== -1;
  var dsFile = cu ? ['Index_Mobile', 'Index'] : ['Index', 'Index_Desktop'];
  var tpl = null, loiCuoi = null;
  for (var i = 0; i < dsFile.length && !tpl; i++) {
    try { tpl = HtmlService.createTemplateFromFile(dsFile[i]); }
    catch (err) { loiCuoi = err; }
  }
  if (!tpl) {
    return HtmlService.createHtmlOutput('<p style="font-family:Arial;padding:20px">Dự án chưa có file giao diện '
      + '<b>Index</b>. Hãy tạo file HTML tên Index rồi triển khai phiên bản mới.<br><small>'
      + (loiCuoi ? loiCuoi.message : '') + '</small></p>');
  }
  return tpl.evaluate()
    .setTitle('Phòng Hạ tầng — UBND xã Đông Thạnh')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Link gốc của ứng dụng — giao diện mới dùng để hiện nút "Giao diện đơn giản". */
function layUrlApp() {
  return ScriptApp.getService().getUrl();
}

function lamMoi(nam) { xoaCache(); return layDuLieu(nam, true); }

/** Dữ liệu của một năm + số liệu tổng hợp các năm. */
function layDuLieu(nam, boQuaCache) {
  nam = +nam || (new Date()).getFullYear();
  var khoa = CACHE_TIEN_TO + nam;
  if (!boQuaCache) {
    var co = layCache(khoa);
    if (co) { co.duocSua = duocSua(); return co; }
  }
  var kq;
  try {
    var ss = banDau_();
    var hs = docHoSo(ss, nam);
    kq = {
      ok: true, nam: nam, namList: hs.namList,
      capNhatLuc: dinhDang(new Date(), "HH:mm 'ngày' dd/MM/yyyy"),
      homNay: dinhDang(new Date(), 'yyyy-MM-dd'),
      hoSo: hs,
      vanBan: docVanBanDen(ss, nam),
      keHoach: docKeHoachTuan(ss),
      capPhep: docCapPhep(ss),
      lich: docLich(ss),
      danhMuc: {
        loai: docDanhMuc(ss, 'LOAI') || Object.keys(MAU_KY_HIEU),
        nhiemVu: docDanhMuc(ss, 'TEN_NHIEM_VU') || hs.dsNhiemVu,
        coQuan: hs.dsCoQuan
      },
      mauKyHieu: MAU_KY_HIEU, macDinh: MAC_DINH_HOSO,
      soNgayHan: SO_NGAY_HAN, coAI: !!GEMINI_API_KEY
    };
  } catch (e) {
    return { ok: false, loi: e.message };
  }
  catCache(khoa, kq);
  kq.duocSua = duocSua();
  return kq;
}

function duocSua() {
  if (!DANH_SACH_SUA.length) return true;
  return DANH_SACH_SUA.indexOf(Session.getActiveUser().getEmail()) !== -1;
}

/* ================================================== CACHE CHIA NHỎ (>100KB) */

function catCache(khoa, obj) {
  try {
    var s = JSON.stringify(obj), KICH = 90000;
    var cache = CacheService.getScriptCache(), goi = {}, n = 0;
    for (var i = 0; i < s.length; i += KICH) { goi[khoa + '_' + n] = s.slice(i, i + KICH); n++; }
    if (n > 50) return;
    goi[khoa] = String(n);
    cache.putAll(goi, CACHE_GIAY);
  } catch (e) { /* bỏ qua */ }
}

function layCache(khoa) {
  try {
    var cache = CacheService.getScriptCache();
    var n = cache.get(khoa);
    if (!n) return null;
    var ks = [];
    for (var i = 0; i < +n; i++) ks.push(khoa + '_' + i);
    var ph = cache.getAll(ks), s = '';
    for (var j = 0; j < +n; j++) { if (!ph[ks[j]]) return null; s += ph[ks[j]]; }
    return JSON.parse(s);
  } catch (e) { return null; }
}

function xoaCache() {
  var ks = [], y = (new Date()).getFullYear();
  for (var nam = y - 15; nam <= y + 1; nam++) {
    ks.push(CACHE_TIEN_TO + nam);
    for (var i = 0; i < 50; i++) ks.push(CACHE_TIEN_TO + nam + '_' + i);
  }
  CacheService.getScriptCache().removeAll(ks);
}

/* ======================================================= CẤU HÌNH BẢNG SỬA */

var CAU_HINH = {
  hoso: {
    sheet: 'XU_LY_HO_SO', khoa: 'SỐ PHIẾU', cotLink: COT_LINK_HOSO, cotTenFile: 'FILE SCAN',
    tieuDe: 'TÊN NHIỆM VỤ/ CÔNG TÁC', phu: 'KÝ HIỆU', noiDung: 'TRÍCH YẾU',
    truong: [
      { cot: 'SỐ PHIẾU', nhan: 'Số phiếu', kieu: 'chiXem' },
      { cot: 'TÊN NHIỆM VỤ/ CÔNG TÁC', nhan: 'Tên nhiệm vụ', kieu: 'text' },
      { cot: 'LOẠI VĂN BẢN', nhan: 'Loại văn bản', kieu: 'chon', nguon: 'LOAI' },
      { cot: 'KÝ HIỆU', nhan: 'Ký hiệu / số văn bản', kieu: 'text' },
      { cot: 'NGÀY TIẾP NHẬN', nhan: 'Ngày tiếp nhận', kieu: 'ngay' },
      { cot: 'HẠN TRẢ', nhan: 'Hạn trả', kieu: 'ngay' },
      { cot: COT_NGAY_HOAN_THANH, nhan: 'Ngày hoàn thành', kieu: 'ngay' },
      { cot: 'TÌNH TRẠNG', nhan: 'Tình trạng', kieu: 'chon',
        chon: ['Tiếp nhận','Đang xử lý','Trình ký','Trả bổ sung','Đã phát hành'] },
      { cot: 'ĐANG TẠI', nhan: 'Đang tại', kieu: 'chon',
        chon: ['Chuyên viên','Lãnh đạo Phòng','Lãnh đạo Ủy ban','Văn thư'] },
      { cot: 'KẾT QUẢ', nhan: 'Kết quả', kieu: 'chon', chon: ['Đang thực hiện','Hoàn thành'] },
      { cot: 'SỐ LƯỢNG', nhan: 'Số lượng', kieu: 'text' },
      { cot: 'CƠ QUAN BAN HÀNH', nhan: 'Cơ quan ban hành', kieu: 'text' },
      { cot: 'HỘP', nhan: 'Hộp', kieu: 'text' },
      { cot: 'KỆ', nhan: 'Kệ', kieu: 'text' },
      { cot: 'NGĂN', nhan: 'Ngăn', kieu: 'text' },
      { cot: 'GHI CHÚ', nhan: 'Ghi chú', kieu: 'dai' }
    ]
  },
  vanban: {
    sheet: 'VAN_BAN_DEN', khoa: 'SỐ TT', cotLink: 'TÊN FILE', cotTenFile: 'FILE SCAN',
    tieuDe: 'TRÍCH YẾU', phu: 'SỐ HIỆU', noiDung: 'TÓM TẮT NỘ DUNG CHÍNH CỦA VĂN BẢN',
    truong: [
      { cot: 'SỐ TT', nhan: 'Mã hồ sơ', kieu: 'chiXem' },
      { cot: 'SỐ HIỆU', nhan: 'Số hiệu văn bản', kieu: 'text' },
      { cot: 'NGÀY VĂN BẢN', nhan: 'Ngày văn bản', kieu: 'ngay' },
      { cot: 'NGÀY NHẬN', nhan: 'Ngày nhận', kieu: 'ngay' },
      { cot: 'HẠN XỬ LÝ', nhan: 'Hạn xử lý', kieu: 'ngay' },
      { cot: 'TRÍCH YẾU', nhan: 'Trích yếu', kieu: 'dai' },
      { cot: 'TÌNH TRẠNG', nhan: 'Tình trạng', kieu: 'chon',
        chon: ['BÁO CÁO','BÁO CÁO CÓ THỜI HẠN','BÁO CÁO KHẨN','XEM ĐỂ BIẾT','THEO DÕI'] },
      { cot: 'HOÀN THÀNH', nhan: 'Hoàn thành', kieu: 'chon',
        chon: ['KHÔNG','ĐANG THỰC HIỆN','HOÀN THÀNH'] },
      { cot: 'PHÂN LOẠI', nhan: 'Phân loại', kieu: 'chon', nguon: 'PHAN_LOAI' },
      { cot: 'FILE SCAN', nhan: 'Tên file scan', kieu: 'text' }
    ]
  }
};

/* ====================================================== CHI TIẾT KHI CHẠM */

function layChiTiet(bang, ma) {
  try {
    var ch = CAU_HINH[bang];
    if (!ch) return { ok: false, loi: 'Bảng không hợp lệ' };
    var ss = moBangTinh_(false);
    var t = moBang(ss, ch.sheet);
    var dong = timSoDong(t, ch.khoa, ma);
    if (!dong) return { ok: false, loi: 'Không tìm thấy ' + ma };

    var gt = t.sh.getRange(dong, 1, 1, t.sh.getLastColumn()).getValues()[0];
    var lay = function (cot) { var i = t.idx[cot]; return i === undefined ? '' : gt[i]; };

    var truong = ch.truong
      .filter(function (f) { return t.idx[f.cot] !== undefined || f.cot === COT_NGAY_HOAN_THANH; })
      .map(function (f) {
        var v = lay(f.cot);
        return { cot: f.cot, nhan: f.nhan, kieu: f.kieu,
          gt: f.kieu === 'ngay' ? dinhDangNgay(v) : chuoi(v),
          isoGt: f.kieu === 'ngay' ? isoNgay(v) : '',
          chon: f.chon || (f.nguon ? docDanhMuc(ss, f.nguon) : null) };
      });

    var link = chuoi(lay(ch.cotLink));
    var id = layIdDrive(link);
    var tenFile = chuoi(lay(ch.cotTenFile));
    if (!id && tenFile) id = timFileTrenDrive(tenFile);

    return { ok: true, bang: bang, ma: ma, duocSua: duocSua(),
      tieuDe: chuoi(lay(ch.tieuDe)) || ma, phu: chuoi(lay(ch.phu)),
      noiDungCot: ch.noiDung, noiDung: chuoi(lay(ch.noiDung)),
      truong: truong, fileId: id, fileLink: link, tenFile: tenFile };
  } catch (e) {
    return { ok: false, loi: e.message };
  }
}

/* ================================================================ GHI SHEET */

function luuChiTiet(bang, ma, thayDoi) {
  if (!duocSua()) return { ok: false, loi: 'Tài khoản của bạn không có quyền sửa.' };
  var ch = CAU_HINH[bang];
  if (!ch) return { ok: false, loi: 'Bảng không hợp lệ' };

  var khoa = LockService.getScriptLock();
  try { khoa.waitLock(20000); }
  catch (e) { return { ok: false, loi: 'Có người đang lưu, thử lại sau vài giây.' }; }

  try {
    var ss = moBangTinh_(false);
    var t = moBang(ss, ch.sheet);
    var dong = timSoDong(t, ch.khoa, ma);
    if (!dong) return { ok: false, loi: 'Không tìm thấy ' + ma };

    var chophep = {};
    ch.truong.forEach(function (f) { if (f.kieu !== 'chiXem') chophep[f.cot] = f.kieu; });
    chophep[ch.noiDung] = 'dai';

    var soCot = 0;
    Object.keys(thayDoi).forEach(function (cot) {
      var kieu = chophep[cot];
      if (kieu === undefined) return;
      var i = t.idx[cot];
      if (i === undefined) {
        if (cot === COT_NGAY_HOAN_THANH) i = themCot(t, cot); else return;
      }
      var v = thayDoi[cot];
      if (kieu === 'ngay') v = v ? new Date(v + 'T00:00:00') : '';
      t.sh.getRange(dong, i + 1).setValue(v);
      soCot++;
    });

    if (bang === 'hoso' && thayDoi['KẾT QUẢ'] !== undefined && thayDoi[COT_NGAY_HOAN_THANH] === undefined) {
      var iHT = t.idx[COT_NGAY_HOAN_THANH];
      if (iHT === undefined) iHT = themCot(t, COT_NGAY_HOAN_THANH);
      var o = t.sh.getRange(dong, iHT + 1);
      if (thayDoi['KẾT QUẢ'] === 'Hoàn thành') { if (!o.getValue()) o.setValue(new Date()); }
      else o.setValue('');
    }

    if (t.idx['NGÀY CẬP NHẬT'] !== undefined)
      t.sh.getRange(dong, t.idx['NGÀY CẬP NHẬT'] + 1).setValue(new Date());

    SpreadsheetApp.flush();
    xoaCache();
    var ct = layChiTiet(bang, ma);
    ct.daLuu = soCot;
    return ct;
  } catch (e) {
    return { ok: false, loi: e.message };
  } finally {
    khoa.releaseLock();
  }
}

/* ============================================================== THÊM HỒ SƠ */

function taoSoPhieu(t, nam) {
  var i = t.idx['SỐ PHIẾU'], max = 0;
  if (i !== undefined && t.sh.getLastRow() > 1) {
    var v = t.sh.getRange(2, i + 1, t.sh.getLastRow() - 1, 1).getValues();
    var re = new RegExp('^(\\d+)\\/' + nam + '\\/PXL$', 'i');
    v.forEach(function (r) {
      var m = chuoi(r[0]).match(re);
      if (m && +m[1] > max) max = +m[1];
    });
  }
  var so = String(max + 1);
  return (so.length < 2 ? '0' + so : so) + '/' + nam + '/PXL';
}

function goiYSoPhieu(nam) {
  try {
    var t = moBang(moBangTinh_(false), 'XU_LY_HO_SO');
    return { ok: true, soPhieu: taoSoPhieu(t, +nam || (new Date()).getFullYear()) };
  } catch (e) { return { ok: false, loi: e.message }; }
}

function themHoSo(d) {
  if (!duocSua()) return { ok: false, loi: 'Tài khoản của bạn không có quyền thêm.' };
  var khoa = LockService.getScriptLock();
  try { khoa.waitLock(20000); }
  catch (e) { return { ok: false, loi: 'Có người đang lưu, thử lại sau vài giây.' }; }

  try {
    var ss = moBangTinh_(false);
    var t = moBang(ss, 'XU_LY_HO_SO');
    var tn = d['NGÀY TIẾP NHẬN'] ? new Date(d['NGÀY TIẾP NHẬN'] + 'T00:00:00') : new Date();
    var nam = tn.getFullYear();
    var soPhieu = taoSoPhieu(t, nam);

    var hanTra = d['HẠN TRẢ'] ? new Date(d['HẠN TRẢ'] + 'T00:00:00') : null;
    if (!hanTra) { hanTra = new Date(tn); hanTra.setDate(hanTra.getDate() + SO_NGAY_HAN); }

    var loai = chuoi(d['LOẠI VĂN BẢN']);
    var kyHieu = chuoi(d['KÝ HIỆU']);
    if (!kyHieu && MAU_KY_HIEU[loai]) kyHieu = MAU_KY_HIEU[loai].replace('{MM/YYYY}', dinhDang(tn, 'MM/yyyy'));

    var gt = {};
    gt['SỐ PHIẾU'] = soPhieu;
    gt['TÊN NHIỆM VỤ/ CÔNG TÁC'] = chuoi(d['TÊN NHIỆM VỤ/ CÔNG TÁC']);
    gt['LOẠI VĂN BẢN'] = loai;
    gt['KÝ HIỆU'] = kyHieu;
    gt['TRÍCH YẾU'] = chuoi(d['TRÍCH YẾU']);
    gt['NGÀY TIẾP NHẬN'] = tn;
    gt['HẠN TRẢ'] = hanTra;
    gt['TÌNH TRẠNG'] = chuoi(d['TÌNH TRẠNG']) || MAC_DINH_HOSO.tinhTrang;
    gt['ĐANG TẠI'] = chuoi(d['ĐANG TẠI']) || MAC_DINH_HOSO.dangTai;
    gt['KẾT QUẢ'] = chuoi(d['KẾT QUẢ']) || MAC_DINH_HOSO.ketQua;
    gt['SỐ LƯỢNG'] = chuoi(d['SỐ LƯỢNG']);
    gt['CƠ QUAN BAN HÀNH'] = chuoi(d['CƠ QUAN BAN HÀNH']);
    gt['HỘP'] = chuoi(d['HỘP']); gt['KỆ'] = chuoi(d['KỆ']); gt['NGĂN'] = chuoi(d['NGĂN']);
    gt['GHI CHÚ'] = chuoi(d['GHI CHÚ']);
    gt['NGÀY CẬP NHẬT'] = new Date();
    gt['NĂM'] = nam;
    if (gt['KẾT QUẢ'] === 'Hoàn thành') gt[COT_NGAY_HOAN_THANH] = new Date();

    var nCot = t.sh.getLastColumn();
    var hang = new Array(nCot).fill('');
    Object.keys(gt).forEach(function (c) { var i = t.idx[c]; if (i !== undefined) hang[i] = gt[c]; });
    t.sh.getRange(t.sh.getLastRow() + 1, 1, 1, nCot).setValues([hang]);
    SpreadsheetApp.flush();
    xoaCache();

    var ct = layChiTiet('hoso', soPhieu);
    ct.daThem = soPhieu;
    ct.namMoi = nam;
    return ct;
  } catch (e) {
    return { ok: false, loi: e.message };
  } finally {
    khoa.releaseLock();
  }
}

/* ============================================================== THÊM LỊCH */

function themLich(d) {
  if (!duocSua()) return { ok: false, loi: 'Tài khoản của bạn không có quyền thêm.' };
  try {
    var ss = moBangTinh_(false);
    var sh = ss.getSheetByName('LICH');
    if (!sh) { sh = ss.insertSheet('LICH'); dungTieuDe_(sh, CAU_TRUC.LICH); }
    var t = moBang(ss, 'LICH');
    var tg = new Date((d.ngay || dinhDang(new Date(), 'yyyy-MM-dd')) + 'T' + (d.gio || '08:00') + ':00');
    var gt = { 'Tiêu đề': chuoi(d.tieuDe), 'Thời gian': tg,
               'Địa điểm': chuoi(d.diaDiem), 'Nội dung tóm tắt': chuoi(d.noiDung) };
    var nCot = Math.max(sh.getLastColumn(), 4);
    var hang = new Array(nCot).fill('');
    Object.keys(gt).forEach(function (c) { var i = t.idx[c]; if (i !== undefined) hang[i] = gt[c]; });
    var dongMoi = sh.getLastRow() + 1;
    sh.getRange(dongMoi, 1, 1, nCot).setValues([hang]);
    if (t.idx['Thời gian'] !== undefined)
      sh.getRange(dongMoi, t.idx['Thời gian'] + 1).setNumberFormat('dd/MM/yyyy HH:mm');
    SpreadsheetApp.flush();
    xoaCache();
    return { ok: true };
  } catch (e) { return { ok: false, loi: e.message }; }
}

/* ============================================================ TẢI FILE LÊN */

function taiFileLen(bang, ma, tep) {
  if (!duocSua()) return { ok: false, loi: 'Tài khoản của bạn không có quyền tải file.' };
  var ch = CAU_HINH[bang];
  if (!ch) return { ok: false, loi: 'Bảng không hợp lệ' };
  try {
    var thuMuc = layThuMuc();
    var blob = Utilities.newBlob(Utilities.base64Decode(tep.base64),
      tep.mime || 'application/pdf', ma.replace(/[\/\\]/g, '-') + ' - ' + tep.ten);
    var file = thuMuc.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var ss = moBangTinh_(false);
    var t = moBang(ss, ch.sheet);
    var dong = timSoDong(t, ch.khoa, ma);
    if (!dong) return { ok: false, loi: 'Không tìm thấy ' + ma };

    var cotLink = t.idx[ch.cotLink];
    if (cotLink === undefined) cotLink = themCot(t, ch.cotLink);
    t.sh.getRange(dong, cotLink + 1).setValue(file.getUrl());
    if (t.idx[ch.cotTenFile] !== undefined)
      t.sh.getRange(dong, t.idx[ch.cotTenFile] + 1).setValue(file.getName());
    if (t.idx['NGÀY CẬP NHẬT'] !== undefined)
      t.sh.getRange(dong, t.idx['NGÀY CẬP NHẬT'] + 1).setValue(new Date());

    SpreadsheetApp.flush();
    xoaCache();
    var ct = layChiTiet(bang, ma);
    ct.daTai = file.getName();
    return ct;
  } catch (e) {
    return { ok: false, loi: e.message };
  }
}

function layThuMuc() {
  if (THU_MUC_LUU) return DriveApp.getFolderById(THU_MUC_LUU);
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('THU_MUC_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* tạo lại */ } }
  var ds = DriveApp.getFoldersByName(TEN_THU_MUC);
  var f = ds.hasNext() ? ds.next() : DriveApp.createFolder(TEN_THU_MUC);
  props.setProperty('THU_MUC_ID', f.getId());
  return f;
}

/* ================================================= ĐỌC DỮ LIỆU DASHBOARD */

function dongHoSo(b, r, homNay, catTrichYeu) {
  var soPhieu = chuoi(b.o(r, 'SỐ PHIẾU'));
  if (!soPhieu) return null;

  var tn = ngay(b.o(r, 'NGÀY TIẾP NHẬN'));
  var hanTra = ngay(b.o(r, 'HẠN TRẢ'));
  var ht = ngay(b.o(r, COT_NGAY_HOAN_THANH));
  var ketQua = chuoi(b.o(r, 'KẾT QUẢ'));
  var conLai = hanTra ? Math.round((dauNgay(hanTra) - homNay) / 86400000) : null;

  var tt = 'dangxuly';
  if (ketQua === 'Hoàn thành') tt = 'hoanthanh';
  else if (conLai !== null && conLai < 0) tt = 'trehan';
  else if (conLai !== null && conLai <= 2) tt = 'saphan';

  var dungHan = null;
  if (tt === 'hoanthanh' && hanTra) dungHan = ht ? dauNgay(ht) <= dauNgay(hanTra) : true;

  var nam = 0;
  var m = soPhieu.match(/\/(\d{4})\/PXL$/i);
  if (m) nam = +m[1]; else if (tn) nam = tn.getFullYear();

  var trichYeu = chuoi(b.o(r, 'TRÍCH YẾU'));
  return {
    ma: soPhieu, nam: nam,
    nhiemVu: chuoi(b.o(r, 'TÊN NHIỆM VỤ/ CÔNG TÁC')),
    loai: chuoi(b.o(r, 'LOẠI VĂN BẢN')),
    kyHieu: chuoi(b.o(r, 'KÝ HIỆU')),
    trichYeu: catTrichYeu ? cat(trichYeu, 140) : trichYeu,
    tiepNhan: dinhDangNgay(b.o(r, 'NGÀY TIẾP NHẬN')),
    hanTra: dinhDangNgay(b.o(r, 'HẠN TRẢ')),
    hoanThanhNgay: ht ? dinhDang(ht, 'dd/MM/yyyy') : '',
    tnIso: tn ? dinhDang(tn, 'yyyy-MM-dd') : '',
    hanIso: hanTra ? dinhDang(hanTra, 'yyyy-MM-dd') : '',
    tinhTrang: chuoi(b.o(r, 'TÌNH TRẠNG')),
    dangTai: chuoi(b.o(r, 'ĐANG TẠI')),
    ketQua: ketQua,
    coQuan: chuoi(b.o(r, 'CƠ QUAN BAN HÀNH')),
    luuTru: [chuoi(b.o(r, 'HỘP')), chuoi(b.o(r, 'KỆ')), chuoi(b.o(r, 'NGĂN'))]
      .map(function (x, i) { return x ? ['Hộp ', 'Kệ ', 'Ngăn '][i] + x : ''; }).filter(Boolean).join(', '),
    coFile: chuoi(b.o(r, COT_LINK_HOSO)) !== '' || chuoi(b.o(r, 'FILE SCAN')) !== '',
    thang: tn ? tn.getMonth() + 1 : 0,
    conLai: conLai, tt: tt, dungHan: dungHan
  };
}

function docHoSo(ss, nam) {
  var rong = { dong: [], tk: { tong: 0, hoanThanh: 0, treHan: 0, sapHan: 0, dangXuLy: 0,
      dungHan: 0, hoanThanhTre: 0, tyLe: 0 },
    theoThang: [], theoLoai: [], theoDangTai: [], theoNam: [], canXuLy: [],
    namList: [nam], tongTatCa: 0, dsNhiemVu: [], dsCoQuan: [] };
  for (var m0 = 1; m0 <= 12; m0++) rong.theoThang.push({ thang: m0, tong: 0, xong: 0, tre: 0 });
  var b = docBang(ss, 'XU_LY_HO_SO');
  if (!b) return rong;

  var homNay = dauNgay(new Date());
  var tatCa = [];
  b.rows.forEach(function (r) { var d = dongHoSo(b, r, homNay, true); if (d) tatCa.push(d); });
  if (!tatCa.length) return rong;

  var mN = {}, namSet = {}, dsNV = {}, dsCQ = {};
  tatCa.forEach(function (d) {
    var k = d.nam || 0;
    if (k) namSet[k] = 1;
    if (!mN[k]) mN[k] = { nam: k, tong: 0, xong: 0, tre: 0, dangXuLy: 0 };
    mN[k].tong++;
    if (d.tt === 'hoanthanh') mN[k].xong++;
    else if (d.tt === 'trehan') mN[k].tre++;
    else mN[k].dangXuLy++;
    if (d.nhiemVu) dsNV[d.nhiemVu] = (dsNV[d.nhiemVu] || 0) + 1;
    if (d.coQuan) dsCQ[d.coQuan] = (dsCQ[d.coQuan] || 0) + 1;
  });
  namSet[(new Date()).getFullYear()] = 1;
  namSet[nam] = 1;
  var namList = Object.keys(namSet).map(Number).sort(function (a, c) { return c - a; });

  var dong = tatCa.filter(function (d) { return d.nam === nam; })
    .sort(function (a, c) { return (c.tnIso || '').localeCompare(a.tnIso || '') || c.ma.localeCompare(a.ma); });

  var tk = {
    tong: dong.length,
    hoanThanh: dem(dong, 'hoanthanh'),
    treHan: dem(dong, 'trehan'),
    sapHan: dem(dong, 'saphan'),
    dangXuLy: dem(dong, 'dangxuly'),
    dungHan: dong.filter(function (d) { return d.dungHan === true; }).length,
    hoanThanhTre: dong.filter(function (d) { return d.dungHan === false; }).length
  };
  tk.tyLe = tk.tong ? Math.round(tk.hoanThanh / tk.tong * 1000) / 10 : 0;

  var theoThang = [];
  for (var m = 1; m <= 12; m++) theoThang.push({ thang: m, tong: 0, xong: 0, tre: 0 });
  dong.forEach(function (d) {
    if (!d.thang) return;
    var o = theoThang[d.thang - 1];
    o.tong++;
    if (d.tt === 'hoanthanh') o.xong++;
    else if (d.tt === 'trehan') o.tre++;
  });

  var canXuLy = tatCa.filter(function (d) { return d.tt !== 'hoanthanh'; })
    .sort(function (a, c) {
      return (a.conLai === null ? 9999 : a.conLai) - (c.conLai === null ? 9999 : c.conLai);
    });

  return {
    dong: dong, tk: tk, theoThang: theoThang,
    theoLoai: nhomDem(dong, 'loai', 'Chưa phân loại'),
    theoDangTai: nhomDem(dong.filter(function (d) { return d.tt !== 'hoanthanh'; }), 'dangTai', 'Chưa rõ'),
    theoNam: Object.keys(mN).filter(function (k) { return +k; }).sort()
      .map(function (k) { return mN[k]; }),
    canXuLy: canXuLy, namList: namList, tongTatCa: tatCa.length,
    dsNhiemVu: Object.keys(dsNV).sort(function (a, c) { return dsNV[c] - dsNV[a]; }).slice(0, 60),
    dsCoQuan: Object.keys(dsCQ).sort(function (a, c) { return dsCQ[c] - dsCQ[a]; }).slice(0, 40)
  };
}

function nhomDem(ds, truong, macDinh) {
  var m = {};
  ds.forEach(function (d) {
    var k = d[truong] || macDinh;
    if (!m[k]) m[k] = { ten: k, tong: 0, xong: 0, tre: 0 };
    m[k].tong++;
    if (d.tt === 'hoanthanh') m[k].xong++;
    else if (d.tt === 'trehan') m[k].tre++;
  });
  return Object.keys(m).map(function (k) { return m[k]; })
    .sort(function (a, c) { return c.tong - a.tong; });
}

/**
 * Mức độ của văn bản đến, lấy theo cột TÌNH TRẠNG.
 *   3 = Báo cáo khẩn, 2 = Báo cáo có thời hạn, 1 = Báo cáo, 0 = Xem để biết / theo dõi
 */
var UU_TIEN_VB = {
  'BÁO CÁO KHẨN': 3, 'CẦN XỬ LÝ GẤP': 3,
  'BÁO CÁO CÓ THỜI HẠN': 2, 'CẦN XỬ LÝ': 2,
  'BÁO CÁO': 1,
  'THEO DÕI': 0, 'XEM ĐỂ BIẾT': 0
};

function dongVanBan(b, r, catTY) {
  var soHieu = chuoi(b.o(r, 'SỐ HIỆU'));
  var trichYeu = chuoi(b.o(r, 'TRÍCH YẾU'));
  if (!soHieu && !trichYeu) return null;
  var tinhTrang = chuoi(b.o(r, 'TÌNH TRẠNG')).toUpperCase();
  var nn = ngay(b.o(r, 'NGÀY NHẬN'));
  var hoanThanh = chuoi(b.o(r, 'HOÀN THÀNH')).toUpperCase();
  var uu = UU_TIEN_VB[tinhTrang] === undefined ? 0 : UU_TIEN_VB[tinhTrang];

  var han = ngay(b.o(r, 'HẠN XỬ LÝ'));
  var hanTuTinh = false;
  if (!han && nn && HAN_THEO_MUC[uu] !== undefined) {
    han = new Date(nn);
    han.setDate(han.getDate() + HAN_THEO_MUC[uu]);
    hanTuTinh = true;
  }
  var homNay = dauNgay(new Date());
  var conLai = han ? Math.round((dauNgay(han) - homNay) / 86400000) : null;
  var xong = hoanThanh === 'HOÀN THÀNH';
  if (uu === 0) { conLai = null; }

  return {
    ma: chuoi(b.o(r, 'SỐ TT')),
    nam: nn ? nn.getFullYear() : 0,
    thang: nn ? nn.getMonth() + 1 : 0,
    ngayNhan: dinhDangNgay(b.o(r, 'NGÀY NHẬN')),
    nnIso: nn ? dinhDang(nn, 'yyyy-MM-dd') : '',
    hanXuLy: han ? dinhDang(han, 'dd/MM/yyyy') : '',
    hanIso: han ? dinhDang(han, 'yyyy-MM-dd') : '',
    hanTuTinh: hanTuTinh,
    conLai: xong ? null : conLai,
    soHieu: soHieu,
    ngayVB: dinhDangNgay(b.o(r, 'NGÀY VĂN BẢN')),
    trichYeu: catTY ? cat(trichYeu, 150) : trichYeu,
    tinhTrang: tinhTrang,
    hoanThanh: hoanThanh,
    phanLoai: chuoi(b.o(r, 'PHÂN LOẠI')),
    coFile: layIdDrive(chuoi(b.o(r, 'TÊN FILE'))) !== '',
    uu: uu
  };
}

function docVanBanDen(ss, nam) {
  var rong = { dong: [], canXuLy: [], theoPhanLoai: [], tongTatCa: 0,
    tk: { tong: 0, canXuLy: 0, dangThucHien: 0, hoanThanh: 0, coFile: 0, treHan: 0 } };
  var b = docBang(ss, 'VAN_BAN_DEN');
  if (!b) return rong;

  var tatCa = [];
  b.rows.forEach(function (r) { var d = dongVanBan(b, r, true); if (d) tatCa.push(d); });

  var dong = tatCa.filter(function (d) { return d.nam === nam || !d.nam; })
    .sort(function (a, c) {
      return (c.nnIso || '').localeCompare(a.nnIso || '')
        || c.ma.localeCompare(a.ma, undefined, { numeric: true });
    });

  var canXuLy = tatCa.filter(function (d) { return d.uu >= 1 && d.hoanThanh !== 'HOÀN THÀNH'; })
    .sort(function (a, c) {
      if (c.uu !== a.uu) return c.uu - a.uu;
      return (a.conLai === null ? 9999 : a.conLai) - (c.conLai === null ? 9999 : c.conLai);
    });

  var mP = {};
  dong.forEach(function (d) { var k = d.phanLoai || 'Chưa phân loại'; mP[k] = (mP[k] || 0) + 1; });

  return {
    dong: dong, canXuLy: canXuLy, tongTatCa: tatCa.length,
    theoPhanLoai: Object.keys(mP).map(function (k) { return { ten: k, so: mP[k] }; })
      .sort(function (a, c) { return c.so - a.so; }).slice(0, 8),
    tk: {
      tong: dong.length, canXuLy: canXuLy.length,
      dangThucHien: dong.filter(function (d) { return d.hoanThanh === 'ĐANG THỰC HIỆN'; }).length,
      hoanThanh: dong.filter(function (d) { return d.hoanThanh === 'HOÀN THÀNH'; }).length,
      treHan: canXuLy.filter(function (d) { return d.conLai !== null && d.conLai < 0; }).length,
      coFile: dong.filter(function (d) { return d.coFile; }).length
    }
  };
}

var THU = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];

function docKeHoachTuan(ss) {
  var b = docBang(ss, 'KE_HOACH_TUAN');
  if (!b) return { ngay: [], viec: [] };
  var nhom = {}, viec = [];
  b.rows.forEach(function (r) {
    var tieuDe = chuoi(b.o(r, 'TIEU_DE'));
    if (!tieuDe) return;
    var d = ngay(b.o(r, 'NGAY'));
    var iso = d ? dinhDang(d, 'yyyy-MM-dd') : '';
    var khoa = iso || 'zzz';
    if (!nhom[khoa]) nhom[khoa] = {
      nhan: d ? THU[d.getDay()] + ', ' + dinhDang(d, 'dd/MM/yyyy') : 'Chưa xếp ngày', viec: [] };
    var v = {
      ngayIso: iso, batDau: gio(b.o(r, 'BAT_DAU')), ketThuc: gio(b.o(r, 'KET_THUC')),
      tieuDe: tieuDe, loai: chuoi(b.o(r, 'LOAI')), uuTien: chuoi(b.o(r, 'UU_TIEN')),
      nguon: cat(chuoi(b.o(r, 'NGUON')), 90), ghiChu: cat(chuoi(b.o(r, 'GHI_CHU')), 220),
      trangThai: chuoi(b.o(r, 'TRANG_THAI'))
    };
    nhom[khoa].viec.push(v); viec.push(v);
  });
  return {
    ngay: Object.keys(nhom).sort().map(function (k) {
      nhom[k].viec.sort(function (a, c) { return (a.batDau || '').localeCompare(c.batDau || ''); });
      return nhom[k];
    }),
    viec: viec
  };
}

function docCapPhep(ss) {
  var b = docBang(ss, 'HO_SO_CAP_PHEP');
  if (!b) return [];
  var out = [];
  b.rows.forEach(function (r) {
    var cdt = chuoi(b.o(r, 'CHỦ ĐẦU TƯ'));
    if (!cdt) return;
    var h = ngay(b.o(r, 'HẠN TRẢ'));
    out.push({
      chuDauTu: cdt, hanTra: dinhDangNgay(b.o(r, 'HẠN TRẢ')),
      hanIso: h ? dinhDang(h, 'yyyy-MM-dd') : '',
      ketQua: chuoi(b.o(r, 'KẾT QUẢ')), capNhat: dinhDangNgay(b.o(r, 'NGÀY CẬP NHẬT'))
    });
  });
  return out;
}

function docLich(ss) {
  var b = docBang(ss, 'LICH');
  if (!b) return [];
  var out = [];
  b.rows.forEach(function (r) {
    var td = chuoi(b.o(r, 'Tiêu đề'));
    if (!td) return;
    var tg = ngay(b.o(r, 'Thời gian'));
    out.push({
      tieuDe: td,
      thoiGian: tg ? dinhDang(tg, "HH:mm 'ngày' dd/MM/yyyy") : chuoi(b.o(r, 'Thời gian')),
      ngayIso: tg ? dinhDang(tg, 'yyyy-MM-dd') : '',
      gio: tg ? dinhDang(tg, 'HH:mm') : '',
      sapXep: tg ? tg.getTime() : 0,
      diaDiem: cat(chuoi(b.o(r, 'Địa điểm')), 120),
      noiDung: cat(chuoi(b.o(r, 'Nội dung tóm tắt')), 220)
    });
  });
  out.sort(function (a, c) { return c.sapXep - a.sapXep; });
  return out.slice(0, 600);
}

function docDanhMuc(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh || sh.getLastRow() < 2) return null;
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  var out = [];
  v.forEach(function (r) { var s = chuoi(r[0]); if (s && out.indexOf(s) === -1) out.push(s); });
  return out.length ? out : null;
}

/* ================================================= TRA CỨU TOÀN BỘ CÁC NĂM */

function timToanBo(tuKhoa, boLoc) {
  try {
    var q = khongDau(chuoi(tuKhoa));
    boLoc = boLoc || {};
    var ss = moBangTinh_(false);
    var homNay = dauNgay(new Date());
    var hoSo = [], vanBan = [];

    var b = docBang(ss, 'XU_LY_HO_SO');
    if (b) {
      for (var i = 0; i < b.rows.length && hoSo.length < 150; i++) {
        var d = dongHoSo(b, b.rows[i], homNay, false);
        if (!d) continue;
        if (boLoc.nam && d.nam !== +boLoc.nam) continue;
        if (boLoc.loai && d.loai !== boLoc.loai) continue;
        if (boLoc.chuaXong && d.tt === 'hoanthanh') continue;
        if (q) {
          var s = khongDau([d.ma, d.nhiemVu, d.kyHieu, d.trichYeu, d.coQuan, d.luuTru,
            d.dangTai, d.tinhTrang, d.loai].join(' | '));
          if (s.indexOf(q) === -1) continue;
        }
        d.trichYeu = cat(d.trichYeu, 200);
        hoSo.push(d);
      }
    }
    var v = docBang(ss, 'VAN_BAN_DEN');
    if (v && q) {
      for (var j = 0; j < v.rows.length && vanBan.length < 100; j++) {
        var e = dongVanBan(v, v.rows[j], false);
        if (!e) continue;
        var nd = chuoi(v.o(v.rows[j], 'TÓM TẮT NỘ DUNG CHÍNH CỦA VĂN BẢN'));
        if (khongDau([e.ma, e.soHieu, e.trichYeu, e.phanLoai, nd].join(' | ')).indexOf(q) === -1) continue;
        e.trichYeu = cat(e.trichYeu, 200);
        vanBan.push(e);
      }
    }
    hoSo.sort(function (a, c) { return (c.tnIso || '').localeCompare(a.tnIso || ''); });
    return { ok: true, hoSo: hoSo, vanBan: vanBan, tuKhoa: tuKhoa };
  } catch (e) { return { ok: false, loi: e.message }; }
}

function khongDau(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/* ================================================================ CHATBOT */

function hoiAI(cauHoi, boiCanh) {
  if (!GEMINI_API_KEY) return { ok: false, loi: 'Chưa cấu hình GEMINI_API_KEY trong Code.gs.' };
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL
      + ':generateContent?key=' + GEMINI_API_KEY;
    var huongDan =
      'Bạn là trợ lý của Phòng Hạ tầng, UBND xã Đông Thạnh, trả lời NGẮN GỌN bằng tiếng Việt '
      + '(tối đa 6 câu hoặc 8 gạch đầu dòng), chỉ dựa trên DỮ LIỆU dưới đây. Nếu dữ liệu không đủ, '
      + 'nói rõ là không có trong dữ liệu đang tải và gợi ý đổi năm hoặc bật tìm tất cả các năm. '
      + 'Không bịa số liệu.\n\nDỮ LIỆU:\n' + cat(String(boiCanh || ''), 6000);
    var res = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        system_instruction: { parts: [{ text: huongDan }] },
        contents: [{ role: 'user', parts: [{ text: cat(String(cauHoi || ''), 600) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
      })
    });
    var js = JSON.parse(res.getContentText());
    if (js.error) return { ok: false, loi: js.error.message };
    var c = ((js.candidates || [])[0] || {}).content;
    var out = c && c.parts ? c.parts.map(function (p) { return p.text || ''; }).join('') : '';
    return { ok: true, traLoi: out || 'Không có phản hồi.' };
  } catch (e) { return { ok: false, loi: e.message }; }
}

/* ================================================================ TIỆN ÍCH */

function moBang(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh) throw new Error('Không có sheet ' + ten + '. Hãy chạy hàm khoiTao một lần.');
  var nCot = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, nCot).getValues()[0];
  var idx = {};
  head.forEach(function (t, i) {
    var k = String(t).replace(/\s+/g, ' ').trim();
    if (k && idx[k] === undefined) idx[k] = i;
  });
  return { sh: sh, idx: idx };
}

function themCot(t, ten) {
  var i = t.sh.getLastColumn();
  t.sh.getRange(1, i + 1).setValue(ten);
  t.idx[ten] = i;
  return i;
}

function timSoDong(t, cot, gt) {
  var i = t.idx[cot];
  if (i === undefined) return 0;
  var v = t.sh.getRange(2, i + 1, Math.max(t.sh.getLastRow() - 1, 1), 1).getValues();
  for (var k = 0; k < v.length; k++) if (chuoi(v[k][0]) === gt) return k + 2;
  return 0;
}

function docBang(ss, ten) {
  var sh = ss.getSheetByName(ten);
  if (!sh || sh.getLastRow() < 2) return null;
  var v = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var idx = {};
  v[0].forEach(function (t, i) {
    var k = String(t).replace(/\s+/g, ' ').trim();
    if (k && idx[k] === undefined) idx[k] = i;
  });
  return {
    rows: v.slice(1).filter(function (r) {
      return r.some(function (c) { return c !== '' && c !== null; });
    }),
    o: function (r, ten2) { var i = idx[ten2]; return i === undefined ? '' : r[i]; }
  };
}

function layIdDrive(url) {
  if (!url) return '';
  var m = String(url).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (m) return m[1];
  m = String(url).match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : '';
}

function timFileTrenDrive(duongDan) {
  var ten = String(duongDan).split('/').pop().trim();
  if (!ten) return '';
  var cache = CacheService.getScriptCache();
  var khoa = 'FILE_' + Utilities.base64EncodeWebSafe(ten).slice(0, 200);
  var co = cache.get(khoa);
  if (co !== null) return co;
  var id = '';
  try { var ds = DriveApp.getFilesByName(ten); if (ds.hasNext()) id = ds.next().getId(); } catch (e) { id = ''; }
  cache.put(khoa, id, 21600);
  return id;
}

function chuoi(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function cat(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }
function dem(ds, tt) { return ds.filter(function (d) { return d.tt === tt; }).length; }
function dauNgay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

function ngay(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  if (typeof v === 'string' && v) {
    var m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) { var d = new Date(+m[3], +m[2] - 1, +m[1]); if (!isNaN(d)) return d; }
    var d2 = new Date(v);
    if (!isNaN(d2)) return d2;
  }
  return null;
}

function dinhDang(d, mau) { return Utilities.formatDate(d, TZ, mau); }
function dinhDangNgay(v) { var d = ngay(v); return d ? dinhDang(d, 'dd/MM/yyyy') : chuoi(v); }
function isoNgay(v) { var d = ngay(v); return d ? dinhDang(d, 'yyyy-MM-dd') : ''; }

function gio(v) {
  if (v instanceof Date && !isNaN(v)) return dinhDang(v, 'HH:mm');
  var s = chuoi(v);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/* ============================================ NHẮC HẠN TRẢ QUA EMAIL (tuỳ chọn) */

function taoLichNhac() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nhacHanTra') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('nhacHanTra').timeBased().atHour(7).nearMinute(30).everyDays(1).create();
  Logger.log('Đã tạo lịch nhắc mỗi ngày lúc 7h30.');
}

function nhacHanTra() {
  var dl = layDuLieu((new Date()).getFullYear(), true);
  if (!dl.ok) return;
  var ds = dl.hoSo.canXuLy.filter(function (d) { return d.conLai !== null && d.conLai <= 2; });
  if (!ds.length) return;
  var dong = ds.map(function (d) {
    return '<tr><td>' + d.ma + '</td><td>' + d.nhiemVu + '</td><td>' + d.hanTra + '</td><td>'
      + (d.conLai < 0 ? 'Trễ ' + (-d.conLai) + ' ngày' : d.conLai === 0 ? 'Hết hạn hôm nay' : 'Còn ' + d.conLai + ' ngày')
      + '</td><td>' + d.dangTai + '</td></tr>';
  }).join('');
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: '[Phòng Hạ tầng] ' + ds.length + ' hồ sơ đến hạn / quá hạn',
    htmlBody: '<p>Danh sách hồ sơ cần xử lý ngày ' + dinhDang(new Date(), 'dd/MM/yyyy') + ':</p>'
      + '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;font-size:13px">'
      + '<tr style="background:#F0622B;color:#fff"><th>Số phiếu</th><th>Nhiệm vụ</th><th>Hạn trả</th><th>Tình trạng</th><th>Đang tại</th></tr>'
      + dong + '</table>'
  });
}
