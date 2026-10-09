import { AxiosError } from "axios";

/**
 * Mã lỗi của backend → câu tiếng Việt hiển thị cho người dùng.
 *
 * Backend trả về `{ success: false, statusCode, code, message, ... }`. `message` là câu chữ
 * cho người đọc: nó đang là tiếng Việt, sẽ đổi sang tiếng Anh, và bị viết lại mỗi khi ai đó
 * sửa câu. `code` là nửa hợp đồng **không đổi** — nên frontend rẽ nhánh theo `code` và tự
 * dựng câu tiếng Việt ở đây, thay vì so khớp `message` như trước
 * (`message.includes("phân công quản lý")` là một dòng có thật trong `staff-mapper.ts`).
 *
 * Danh sách này phải khớp với `Ikiot_BE/src/common/errors/error-codes.ts`. Mã ở đó là
 * **append-only**, nên bảng này chỉ thêm chứ không đổi khoá.
 *
 * **Một số câu ở đây cố tình chung chung hơn `message` của backend**, vì message gốc có chèn
 * số liệu chạy thật (`Không đủ tồn kho cho X: cần 5, còn 2`) mà bảng tĩnh không tái tạo
 * được. Khi cần đúng con số, backend phải trả thêm dữ liệu có cấu trúc trong `errors` —
 * hiện chưa làm.
 */
export const ERROR_MESSAGES = {
  ACCOUNT_HAS_NO_BRANCH: "Tài khoản chưa được phân về chi nhánh nào",
  ACCOUNT_HAS_NO_LOCATION: "Tài khoản chưa được phân về chi nhánh hoặc kho nào",
  ACCOUNT_HAS_NO_TENANT: "Tài khoản không thuộc cửa hàng nào",
  ACCOUNT_INACTIVE: "Tài khoản đã bị khóa hoặc chưa kích hoạt",
  ACCOUNT_NOT_FOUND_OR_LOCKED: "Tài khoản không tồn tại hoặc đã bị khóa",
  ACCOUNT_NOT_REGISTERED: "Email này chưa được đăng ký trong hệ thống",
  ADMIN_ONLY: "Chỉ quản trị viên hệ thống mới thực hiện được thao tác này",
  AI_CONVERSATION_NOT_FOUND: "Không tìm thấy cuộc hội thoại",
  AI_NOT_CONFIGURED: "Trợ lý AI chưa được cấu hình trên máy chủ",
  BAD_REQUEST: "Yêu cầu không hợp lệ",
  BRANCH_ID_REQUIRED: "Cần chỉ rõ branchId",
  BRANCH_NOT_FOUND: "Không tìm thấy chi nhánh đang hoạt động",
  BRANCH_NOT_IN_TENANT: "Chi nhánh không thuộc cửa hàng của bạn",
  BRAND_IN_USE: "Không thể xoá thương hiệu vì vẫn còn sản phẩm sử dụng",
  BRAND_NOT_FOUND: "Không tìm thấy thương hiệu",
  CASH_DRAWER_ALREADY_OPEN: "Chi nhánh này đã có ca quầy cho hôm nay hoặc đang có ca chưa đóng",
  CASH_DRAWER_BRANCH_DENIED: "Bạn không thao tác được với quầy của chi nhánh khác",
  CASH_DRAWER_CLOSED: "Ca quầy đã đóng",
  CASH_DRAWER_CONFLICT: "Ca quầy vừa thay đổi, vui lòng tải lại và thử lại",
  CASH_DRAWER_END_LOG_REQUIRED: "Nhân viên đang giữ quầy phải ghi phiếu kết ca cuối cùng trước khi chốt",
  CASH_DRAWER_NONE_OPEN: "Không có ca quầy nào đang mở",
  CASH_DRAWER_NOT_FOUND: "Không tìm thấy ca quầy",
  CASH_DRAWER_NOT_HOLDER: "Chỉ nhân viên đang giữ quầy mới ghi được phiếu ca",
  CASH_FLOW_NOT_FOUND: "Không tìm thấy giao dịch",
  CATEGORY_HAS_CHILDREN: "Không thể xoá danh mục vì vẫn còn danh mục con",
  CATEGORY_IN_USE: "Không thể xoá danh mục vì vẫn còn sản phẩm sử dụng",
  CATEGORY_NOT_FOUND: "Không tìm thấy danh mục",
  CATEGORY_PARENT_CYCLE: "Không thể đặt danh mục con làm danh mục cha",
  CATEGORY_PARENT_NOT_FOUND: "Danh mục cha không tồn tại",
  CATEGORY_PARENT_SELF: "Danh mục không thể là cha của chính nó",
  CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không đúng",
  CUSTOMER_CODE_TAKEN: "Mã khách hàng đã tồn tại",
  CUSTOMER_NOT_FOUND: "Không tìm thấy khách hàng",
  CUSTOMER_PHONE_TAKEN: "Số điện thoại này đã thuộc về một khách hàng khác",
  DATE_RANGE_INVALID: "fromDate phải trước hoặc bằng toDate",
  EMAIL_ALREADY_IN_USE: "Email đã được sử dụng",
  FOREIGN_KEY_VIOLATION: "Dữ liệu liên kết không tồn tại hoặc đang được sử dụng",
  GOOGLE_CALENDAR_NOT_CONFIGURED: "Chưa cấu hình GOOGLE_CALENDAR_API_KEY trên máy chủ",
  GOOGLE_CALENDAR_SYNC_FAILED: "Đồng bộ Google Calendar thất bại",
  GOOGLE_EMAIL_MISSING: "Tài khoản Google không có địa chỉ email",
  GOOGLE_EMAIL_UNVERIFIED: "Email Google chưa được xác thực",
  GOOGLE_SIGNIN_NOT_CONFIGURED: "Đăng nhập Google chưa được cấu hình trên máy chủ",
  GOOGLE_TOKEN_INVALID: "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn",
  HOLIDAY_DATE_INVALID: "Ngày lễ không hợp lệ (định dạng YYYY-MM-DD và phải là ngày có thật)",
  HOLIDAY_DUPLICATE: "Ngày lễ này đã tồn tại",
  HOLIDAY_NOT_FOUND: "Không tìm thấy ngày lễ",
  HOLIDAY_UPDATE_EMPTY: "Phải cung cấp date hoặc name",
  IDENTIFICATION_ALREADY_IN_USE: "Số căn cước đã tồn tại",
  IDENTIFICATION_DOB_INVALID: "Ngày sinh của nhân viên không hợp lệ",
  IDENTIFICATION_GENDER_MISMATCH: "Giới tính trên số căn cước không khớp với giới tính của nhân viên",
  IDENTIFICATION_LENGTH_INVALID: "Số căn cước phải gồm đúng 12 chữ số",
  IDENTIFICATION_NOT_NUMERIC: "Số căn cước chỉ được chứa chữ số",
  IDENTIFICATION_PROVINCE_INVALID: "Mã nơi đăng ký khai sinh trên số căn cước không hợp lệ",
  IDENTIFICATION_REQUIRED: "Số căn cước là bắt buộc",
  IDENTIFICATION_YEAR_MISMATCH: "Năm sinh trên số căn cước không khớp với ngày sinh của nhân viên",
  IMPORT_PRICE_ABOVE_RETAIL: "Đơn giá nhập không được lớn hơn giá bán lẻ",
  IMPORT_PRICE_MUST_BE_POSITIVE: "Đơn giá nhập phải lớn hơn 0",
  INSUFFICIENT_STOCK: "Hàng trên kệ không đủ", // tồn kho bán được = hàng trên kệ (stock − đã khoá)
  INTERNAL_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại sau",
  INVALID_CREDENTIALS: "Số điện thoại hoặc mật khẩu không đúng",
  INVENTORY_ALREADY_AT_LOCATION: "Mặt hàng đã có tại địa điểm này",
  INVENTORY_NOT_FOUND: "Không tìm thấy dòng tồn kho",
  INVENTORY_STILL_HAS_STOCK: "Không thể gỡ mặt hàng khỏi địa điểm khi vẫn còn tồn kho. Hãy chuyển hoặc bán hết trước.",
  INVOICE_NOT_FOUND: "Không tìm thấy hoá đơn",
  LOCATION_ALREADY_DELETED: "Địa điểm đã bị xoá",
  LOCATION_NOT_FOUND: "Không tìm thấy địa điểm",
  LOCATION_REQUIRED: "Điều chỉnh tồn kho phải chỉ rõ chi nhánh hoặc kho",
  LOCATION_STAFF_NOT_ELIGIBLE: "Nhân viên không đủ điều kiện làm quản lý địa điểm này",
  LOCATION_STAFF_POSTED_ELSEWHERE: "Nhân viên đang làm việc tại địa điểm khác",
  LOCATION_STAFF_STILL_ATTACHED: "Không thể xoá địa điểm khi vẫn còn nhân viên trực thuộc",
  LOGIN_MOBILE_STAFF_ONLY: "Ứng dụng chỉ dành cho nhân viên và quản lý",
  LOGIN_WEB_CUSTOMER_DENIED: "Tài khoản khách hàng không đăng nhập được vào trang quản trị",
  NOTIFICATION_NOT_FOUND: "Không tìm thấy thông báo",
  ORDER_BRANCH_DENIED: "Bạn chỉ tạo được đơn hàng cho chi nhánh của mình",
  ORDER_CUSTOMER_PAY_TOO_LOW: "Số tiền khách đưa nhỏ hơn số phải trả",
  ORDER_DISCOUNT_CONFLICT: "Không thể vừa giảm giá cả đơn vừa áp dụng khuyến mãi trên cùng một đơn hàng",
  ORDER_DISCOUNT_VALUE_REQUIRED: "Giảm giá cả đơn cần discountValue lớn hơn 0",
  ORDER_LINE_DISCOUNT_EXCEEDS_TOTAL: "Giảm giá vượt quá giá trị dòng hàng",
  ORDER_NOT_FOUND: "Không tìm thấy đơn hàng",
  ORDER_NOT_PENDING_SEPAY: "Đơn hàng không còn ở trạng thái chờ thanh toán SePay",
  ORDER_PAYMENT_CONFLICT: "Đơn hàng vừa được thanh toán hoặc đã bị hủy, vui lòng tải lại",
  ORDER_PROMOTION_ALLOCATION_MISMATCH: "Không khớp được giảm giá với dòng hàng trong đơn",
  ORDER_STATUS_CONFLICT: "Trạng thái đơn hàng vừa thay đổi, vui lòng tải lại",
  ORDER_STATUS_TRANSITION_INVALID: "Không thể chuyển đơn hàng sang trạng thái này",
  ORDER_TRANSFER_AMOUNT_SHORT: "Số tiền chuyển khoản nhỏ hơn số phải trả",
  OTP_EXPIRED: "Mã OTP đã hết hạn hoặc chưa được yêu cầu. Vui lòng lấy mã mới.",
  OTP_INVALID: "Mã OTP không đúng",
  OTP_SEND_FAILED: "Không gửi được mã OTP qua SMS. Vui lòng thử lại sau ít phút.",
  PASSWORD_CONFIRMATION_MISMATCH: "Mật khẩu nhập lại không khớp",
  PASSWORD_NOT_SET: "Tài khoản này chưa đặt mật khẩu",
  PERMISSION_DENIED: "Bạn không có quyền thực hiện thao tác này",
  PHONE_ALREADY_REGISTERED: "Số điện thoại đã được đăng ký",
  PHONE_LENGTH_INVALID: "Số điện thoại phải gồm đúng 10 chữ số",
  PHONE_NOT_REGISTERED: "Số điện thoại chưa được đăng ký trong hệ thống hoặc tài khoản đã bị khóa.",
  PHONE_PREFIX_INVALID: "Đầu số điện thoại di động Việt Nam không hợp lệ",
  PHONE_REQUIRED: "Số điện thoại là bắt buộc",
  PHONE_RESERVED_RANGE: "Số điện thoại này không dùng làm số nhân viên được",
  PLAN_IS_FREE: "Gói miễn phí dùng luồng dùng thử, không mua qua đây",
  PLAN_NOT_FOUND: "Không tìm thấy gói dịch vụ hoặc gói đã ngừng bán",
  PLAN_QUOTA_EXCEEDED: "Đã đạt giới hạn của gói dịch vụ. Vui lòng nâng cấp gói.",
  PLAN_UPDATE_EMPTY: "Không có trường nào để cập nhật",
  PRODUCT_DISCONTINUED: "Sản phẩm đã ngừng kinh doanh",
  PRODUCT_HAS_STOCK: "Không thể ngừng kinh doanh: sản phẩm vẫn còn tồn kho.",
  PRODUCT_IN_STOCK_MOVEMENT: "Không thể ngừng kinh doanh: sản phẩm đang nằm trong phiếu chuyển kho chưa hoàn tất.",
  PRODUCT_IN_UNPAID_ORDER: "Không thể ngừng kinh doanh: sản phẩm đang nằm trong đơn hàng chưa thanh toán.",
  PRODUCT_ITEM_AT_LOCATION: "Không thể xoá mặt hàng khi nó vẫn được gán cho một hoặc nhiều địa điểm. Hãy gỡ khỏi tất cả địa điểm trước.",
  PRODUCT_ITEM_HAS_TRANSACTIONS: "Không thể xoá mặt hàng vì đã phát sinh đơn hàng hoặc phiếu chuyển kho. Hãy ngừng kinh doanh sản phẩm thay vì xoá.",
  PRODUCT_ITEM_IN_PROMOTION: "Không thể xoá mặt hàng vì đang nằm trong một chương trình khuyến mãi.",
  PRODUCT_ITEM_NOT_FOUND: "Không tìm thấy mặt hàng",
  PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm",
  PROMOTION_BRANCH_DENIED: "Khuyến mãi này không áp dụng cho chi nhánh của bạn",
  PROMOTION_CUSTOMER_USAGE_EXHAUSTED: "Khách hàng đã hết lượt sử dụng khuyến mãi này",
  PROMOTION_MAX_DISCOUNT_INVALID: "maxDiscountAmount chỉ dùng được khi giảm theo phần trăm",
  PROMOTION_NOT_APPLICABLE: "Một khuyến mãi đã chọn không còn tồn tại hoặc không áp dụng cho đơn này",
  PROMOTION_NOT_ELIGIBLE: "Khuyến mãi không đủ điều kiện áp dụng cho đơn này",
  PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi",
  PROMOTION_NOT_STACKABLE: "Chỉ có thể chọn thêm khuyến mãi được phép cộng dồn (stackable)",
  PROMOTION_ORDER_ID_REQUIRED: "Cần orderId để áp dụng khuyến mãi",
  PROMOTION_STACK_LIMIT: "Vượt quá số khuyến mãi được cộng dồn",
  PROMOTION_USAGE_EXHAUSTED: "Khuyến mãi đã hết lượt sử dụng",
  QUANTITY_MUST_BE_POSITIVE: "Số lượng phải lớn hơn 0",
  RECORD_NOT_FOUND: "Không tìm thấy bản ghi cần thao tác",
  REFRESH_TOKEN_INVALID: "Refresh token không hợp lệ",
  RELATION_VIOLATION: "Thao tác này vi phạm ràng buộc giữa các bảng",
  REPORT_RANGE_TOO_LONG: "Khoảng thời gian báo cáo vượt quá giới hạn cho phép",
  REQUIRED_FIELD_MISSING: "Thiếu trường bắt buộc",
  RESET_TOKEN_INVALID: "Mã xác thực đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
  RESET_TOKEN_WRONG_TYPE: "Token không hợp lệ cho thao tác đặt lại mật khẩu",
  ROLE_BEYOND_GRANT: "Không thể gán vai trò có quyền vượt quá quyền của bạn",
  ROLE_IN_USE: "Không thể xoá vai trò đang được gán cho nhân viên. Hãy chuyển họ sang vai trò khác trước.",
  ROLE_NOT_FOUND: "Không tìm thấy vai trò",
  ROLE_NOT_IN_TENANT: "Vai trò không thuộc cửa hàng của bạn",
  SCHEDULE_COMPLETED_CANNOT_DELETE: "Không thể xóa lịch làm việc đã hoàn thành",
  SCHEDULE_LOCATION_REQUIRED: "Thiếu thông tin chi nhánh hoặc kho",
  SCHEDULE_NOT_EDITABLE: "Không tìm thấy lịch làm việc có thể sửa",
  SCHEDULE_NOT_FOUND: "Không tìm thấy lịch làm việc",
  SCHEDULE_OVERLAP: "Nhân viên bị trùng ca làm việc",
  SCHEDULE_STAFF_INVALID: "Một hoặc nhiều nhân viên không hợp lệ",
  SCHEDULE_USER_NOT_ASSIGNED: "Nhân viên không thuộc lịch làm việc này",
  SCOPE_FILTER_DENIED: "Bạn chỉ xem được dữ liệu thuộc phạm vi của mình",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi, vui lòng đăng nhập lại",
  SHIFT_LOG_HANDOVER_INVALID: "Ca hiện tại đã bắt đầu, hoặc bạn không được bàn giao ca này",
  SHIFT_LOG_NEXT_STAFF_INVALID: "nextStaffId chỉ dùng được với phiếu kết ca (END)",
  SHIFT_LOG_NEXT_STAFF_SELF: "Người nhận ca phải là người khác",
  SHIFT_LOG_START_REQUIRED: "Cần ghi phiếu bắt đầu ca (START) trước",
  SHIFT_TEMPLATE_INVALID: "Một hoặc nhiều ca mẫu không hợp lệ",
  SHIFT_TEMPLATE_NOT_FOUND: "Không tìm thấy ca mẫu",
  SKU_DUPLICATE_IN_REQUEST: "SKU bị trùng trong cùng một yêu cầu",
  SKU_TAKEN: "SKU đã tồn tại trong cửa hàng",
  SMS_NOT_CONFIGURED: "Dịch vụ SMS chưa được cấu hình",
  STAFF_ACCOUNT_ALREADY_DEACTIVATED: "Tài khoản nhân viên đã bị vô hiệu hóa",
  STAFF_ACCOUNT_EXISTS: "Nhân viên đã có tài khoản đăng nhập",
  STAFF_ACCOUNT_NOT_ACTIVATED: "Tài khoản nhân viên chưa được kích hoạt",
  STAFF_ACCOUNT_ONLY: "Chỉ tài khoản nhân viên mới thao tác được qua endpoint này",
  STAFF_IS_LOCATION_MANAGER: "Nhân viên này đang là quản lý của một chi nhánh hoặc kho. Hãy bổ nhiệm người khác trước.",
  STAFF_NOT_AT_BRANCH: "Không tìm thấy nhân viên đang hoạt động tại chi nhánh này",
  STAFF_NOT_FOUND: "Không tìm thấy nhân viên",
  STAFF_SELF_EDIT_DENIED: "Không thể tự sửa hồ sơ của mình ở đây - dùng /auth/me",
  STAFF_SINGLE_LOCATION_REQUIRED: "Nhân viên chỉ được trực thuộc một chi nhánh hoặc một kho",
  STATS_LOCATION_DENIED: "Bạn chỉ xem được báo cáo của địa điểm mình",
  STOCK_MOVEMENT_ADJUST_HAS_DESTINATION: "Phiếu kiểm kê không có địa điểm nhận",
  STOCK_MOVEMENT_ADJUST_NEGATIVE: "Điều chỉnh làm tồn kho xuống dưới 0",
  STOCK_MOVEMENT_CANCEL_DENIED: "Bạn không có quyền hủy phiếu này",
  STOCK_MOVEMENT_CANCEL_STATUS_INVALID: "Không thể hủy phiếu ở trạng thái hiện tại",
  STOCK_MOVEMENT_COUNTED_QTY_REQUIRED: "Thiếu số lượng thực đếm cho một hoặc nhiều mặt hàng",
  STOCK_MOVEMENT_DESTINATION_REQUIRED: "Phiếu nhập phải có địa điểm nhận",
  STOCK_MOVEMENT_DUPLICATE_ITEM: "Một mặt hàng chỉ được xuất hiện một lần trong phiếu",
  STOCK_MOVEMENT_EMPTY: "Không thể chốt phiếu chưa có mặt hàng",
  STOCK_MOVEMENT_LOCATION_DENIED: "Bạn chỉ thao tác được với phiếu tại nơi làm việc của mình",
  STOCK_MOVEMENT_NOT_ADJUST: "Chỉ phiếu kiểm kê mới duyệt theo cách này",
  STOCK_MOVEMENT_NOT_FOUND: "Không tìm thấy phiếu chuyển kho",
  STOCK_MOVEMENT_NO_ADJUSTMENT: "Không có chênh lệch nào: số thực đếm bằng số hệ thống cho mọi mặt hàng",
  STOCK_MOVEMENT_READ_DENIED: "Bạn không có quyền xem phiếu này",
  STOCK_MOVEMENT_RECEIVED_QTY_EXCEEDS: "Số thực nhận vượt quá số lượng trên phiếu",
  STOCK_MOVEMENT_RECEIVED_QTY_REQUIRED: "Thiếu số lượng thực nhận cho một hoặc nhiều mặt hàng",
  STOCK_MOVEMENT_RECEIVE_EMPTY: "Không thể nhận phiếu rỗng: phải có ít nhất một mặt hàng có số lượng thực nhận > 0",
  STOCK_MOVEMENT_SAME_LOCATION: "Địa điểm xuất và địa điểm nhận không được trùng nhau",
  STOCK_MOVEMENT_SHOULD_BE_RETURN: "Chuyển hàng từ chi nhánh về kho phải dùng loại phiếu RETURN thay vì EXPORT",
  STOCK_MOVEMENT_SOURCE_REQUIRED: "Phiếu phải có địa điểm xuất",
  STOCK_MOVEMENT_STATUS_INVALID: "Phiếu không ở trạng thái cho phép thao tác này",
  STOCK_MOVEMENT_SUPPLIER_REQUIRED: "Phiếu nhập phải có nhà cung cấp",
  STOCK_MOVEMENT_WRITE_DENIED: "Bạn không có quyền sửa phiếu này",
  SUBSCRIPTION_ALREADY_EXISTS: "Cửa hàng đã có gói dịch vụ",
  SUBSCRIPTION_CANCELLED: "Gói dịch vụ đã bị huỷ. Vui lòng đăng ký lại để tiếp tục sử dụng.",
  SUBSCRIPTION_EXPIRED: "Gói dịch vụ đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.",
  SUBSCRIPTION_MISSING: "Cửa hàng chưa có gói dịch vụ nào",
  SUBSCRIPTION_NOT_FOUND: "Không tìm thấy gói dịch vụ đang hoạt động",
  SUPPLIER_CREDIT_LIMIT_EXCEEDED: "Vượt hạn mức công nợ của nhà cung cấp",
  SUPPLIER_HAS_DEBT: "Không thể xoá nhà cung cấp khi còn công nợ",
  SUPPLIER_HAS_TRANSACTIONS: "Không thể xoá nhà cung cấp đã phát sinh hàng hoá hoặc giao dịch. Bạn có thể ngừng sử dụng thay vì xoá.",
  SUPPLIER_NOT_FOUND: "Không tìm thấy nhà cung cấp",
  SUPPLIER_PAYMENT_EXCEEDS_DEBT: "Số tiền thanh toán vượt quá công nợ hiện tại",
  TENANT_BANKING_NOT_CONFIGURED: "Cửa hàng chưa cấu hình thông tin ngân hàng để nhận thanh toán SePay",
  TENANT_ID_REQUIRED: "Thao tác này cần chỉ rõ cửa hàng",
  TENANT_MISMATCH: "Không thể truy cập dữ liệu của cửa hàng khác",
  TENANT_NAME_TAKEN: "Tên cửa hàng đã được sử dụng",
  TENANT_NOT_FOUND: "Không tìm thấy cửa hàng",
  TENANT_OWNER_ONLY: "Chỉ chủ cửa hàng mới thực hiện được thao tác này",
  TICKET_ACCESS_DENIED: "Không có quyền với yêu cầu hỗ trợ này",
  TICKET_CLOSED: "Không thể trả lời yêu cầu đã đóng",
  TICKET_NOT_FOUND: "Không tìm thấy yêu cầu hỗ trợ",
  TRIAL_CANNOT_RENEW: "Gói dùng thử không gia hạn được. Vui lòng nâng cấp lên gói trả phí.",
  TRIAL_PLAN_UNAVAILABLE: "Gói dùng thử hiện không khả dụng",
  UNAUTHENTICATED: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  UNIQUE_VIOLATION: "Giá trị đã tồn tại",
  UPLOAD_FAILED: "Tải tệp lên thất bại",
  UPLOAD_FILE_REQUIRED: "Chưa chọn tệp để tải lên",
  UPLOAD_FILE_TOO_LARGE: "Tệp vượt quá giới hạn 5MB",
  UPLOAD_FORMAT_UNSUPPORTED: "Định dạng tệp không được hỗ trợ",
  UPLOAD_NOT_CONFIGURED: "Dịch vụ lưu trữ ảnh chưa được cấu hình trên máy chủ",
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  VALIDATION_FAILED: "Dữ liệu gửi lên không hợp lệ",
  VALUE_TOO_LONG: "Giá trị vượt quá độ dài cho phép",
  WAREHOUSE_NOT_FOUND: "Không tìm thấy kho",
  WAREHOUSE_NOT_IN_TENANT: "Kho không thuộc cửa hàng của bạn",
  WEBHOOK_API_KEY_INVALID: "API key không hợp lệ",

  // ── Hành trình đơn hàng (P0-3/P0-6, 2026-10-02) ─────────────────────────────
  // Giữ hàng, lô hàng, kho hàng hỏng
  INSUFFICIENT_AVAILABLE_STOCK: "Không đủ hàng có thể bán (một phần đã được giữ cho đơn khác)",
  INVENTORY_LOT_SHORTAGE: "Số liệu lô hàng không khớp tồn kho, vui lòng báo quản trị",
  INVENTORY_CUSTOM_LOT_NOT_FOUND: "Không tìm thấy lô hàng làm riêng cho dòng đơn này tại kho",
  LOCATION_NOT_SELLABLE: "Không thể giữ hoặc bán hàng ở kho hàng hỏng",
  LOCATION_DAMAGED_INVALID: "Kho hàng hỏng phải là một kho hàng hỏng khác của cửa hàng",
  LOCATION_DAMAGED_REQUIRED: "Kho này chưa có kho hàng hỏng mặc định",
  RESERVATION_NOT_ACTIVE: "Dòng đơn chưa được giữ đủ hàng tại kho này",
  RESERVATION_NOT_FOUND: "Không tìm thấy phần hàng đã giữ",
  // Nhập hàng 2 luồng
  IMPORT_SOURCE_REQUIRED: "Cần chọn luồng nhập: từ nhà cung cấp hay từ xưởng",
  IMPORT_SOURCE_SUPPLIER_MISMATCH: "Loại nhà cung cấp không khớp với luồng nhập đã chọn",
  IMPORT_PRODUCTION_ITEM_REQUIRED: "Mỗi dòng nhập từ xưởng phải gắn với một dòng yêu cầu sản xuất",
  IMPORT_PRODUCTION_ITEM_MISMATCH: "Dòng yêu cầu sản xuất không khớp xưởng, sản phẩm hoặc đã đóng",
  IMPORT_PRODUCTION_QTY_EXCEEDS: "Số nhận vượt quá số còn lại của yêu cầu sản xuất",
  STOCK_MOVEMENT_DEFECT_QTY_EXCEEDS: "Số hàng lỗi không được vượt quá số thực nhận",
  // Đơn hàng
  ORDER_ASSIGNEE_REQUIRED: "Đơn đã xác nhận phải có người phụ trách",
  ORDER_ASSIGNEE_INVALID: "Người phụ trách không hợp lệ hoặc đã ngừng hoạt động",
  ORDER_CANCEL_NOT_ALLOWED: "Đơn đã bàn giao, không huỷ được - hãy tạo đơn hoàn",
  ORDER_COMBO_INVALID: "Combo không hợp lệ",
  ORDER_EMPTY: "Đơn hàng chưa có sản phẩm",
  ORDER_ITEM_CUSTOM_LOCKED: "Thông số hàng làm riêng đã khoá vì đã gửi xưởng",
  ORDER_ITEM_NOT_CUSTOMIZABLE: "Sản phẩm này không nhận làm theo yêu cầu",
  ORDER_ITEM_NOT_FOUND: "Không tìm thấy dòng đơn",
  ORDER_NOT_CONFIRMABLE: "Chỉ xác nhận được đơn nháp hoặc đơn chờ xác nhận",
  ORDER_NOT_DRAFT: "Chỉ sửa được đơn nháp",
  ORDER_SOURCE_LOCATION_INVALID: "Kho xuất không hợp lệ",
  ORDER_NOT_EDITABLE: "Đơn này không sửa được nữa (đã đóng gói thì không đổi hàng, đã giao đi thì không sửa)",
  ORDER_ITEM_IN_PRODUCTION: "Dòng hàng này đã nằm trong yêu cầu sản xuất - gỡ khỏi yêu cầu trước khi bỏ",
  ORDER_DEPOSIT_CHANGED: "Tiền cọc sau khi sửa sẽ khác số đã thu - hãy giữ nguyên số tiền cọc",
  ORDER_DEPOSIT_EXCEEDS_TOTAL: "Tiền cọc vượt quá tổng tiền đơn",
  ORDER_REFUND_AMOUNT_REQUIRED: "Đơn có tiền cọc - hãy nhập số tiền hoàn cho khách (0 nếu giữ lại)",
  ORDER_REFUND_EXCEEDS_DEPOSIT: "Số tiền hoàn vượt quá tiền cọc còn giữ",
  ORDER_REMITTANCE_AMOUNT_MISMATCH: "Số tiền nhận không khớp với số shipper đã thu",
  ORDER_REMITTANCE_NOT_PENDING: "Đơn này không có tiền mặt nào đang chờ shipper nộp lại",
  ORDER_SHIP_INSUFFICIENT_STOCK: "Không đủ hàng để chuyển đơn sang đang vận chuyển",
  // Yêu cầu sản xuất
  PRODUCTION_REQUEST_CUSTOM_LINE_REQUIRED: "Hàng làm riêng phải gắn với dòng đơn tương ứng",
  PRODUCTION_REQUEST_EMPTY: "Yêu cầu sản xuất chưa có dòng nào",
  PRODUCTION_REQUEST_ITEM_NOT_FOUND: "Không tìm thấy dòng yêu cầu sản xuất",
  PRODUCTION_REQUEST_LOCKED: "Yêu cầu đã gửi xưởng, không sửa được nữa",
  PRODUCTION_REQUEST_NOT_FOUND: "Không tìm thấy yêu cầu sản xuất",
  PRODUCTION_REQUEST_STATUS_INVALID: "Không chuyển được yêu cầu sản xuất sang trạng thái này",
  SUPPLIER_NOT_WORKSHOP: "Nhà cung cấp được chọn không phải xưởng",
  SUPPLIER_TYPE_LOCKED: "Không đổi được loại nhà cung cấp đã có phiếu nhập hoặc yêu cầu sản xuất",
  IMPORT_WORKSHOP_VIA_PRODUCTION_REQUEST: "Hàng của xưởng nhập qua yêu cầu sản xuất, không nhập bằng phiếu nhập thường",
  PRODUCTION_REQUEST_DUPLICATE_ITEM: "Mặt hàng này đã có trong yêu cầu sản xuất",
  PRODUCTION_REQUEST_ORDER_ITEM_INVALID: "Dòng đơn không hợp lệ: khác mặt hàng, không thuộc cửa hàng hoặc đã giao đi",
  PRODUCTION_REQUEST_LOCATION_DENIED: "Bạn chỉ thao tác được yêu cầu sản xuất giao về nơi mình làm việc",
  PRODUCTION_REQUEST_HAS_RECEIPTS: "Yêu cầu đã nhận hàng, không huỷ được",
  PRODUCTION_REQUEST_RECEIVE_EMPTY: "Phải nhận ít nhất một dòng với số lượng lớn hơn 0",
  PRODUCTION_REQUEST_CODE_UNAVAILABLE: "Không tạo được mã yêu cầu sản xuất, vui lòng thử lại",
  PRODUCTION_REQUEST_ITEM_NOT_PRODUCIBLE: "Chỉ đặt xưởng được sản phẩm thường (không phải combo hay dịch vụ)",
  PRODUCTION_REQUEST_CLOSE_REASON_REQUIRED: "Đóng yêu cầu khi chưa nhận đủ phải ghi lý do",
  // Nhân viên xưởng & phiếu giao xưởng (2026-10-09)
  WORKSHOP_STAFF_NOT_LINKED: "Tài khoản chưa được gắn với xưởng nào",
  USER_WORKSHOP_INVALID: "Xưởng đã chọn không phải xưởng của cửa hàng",
  PRODUCTION_DELIVERY_NOT_FOUND: "Không tìm thấy phiếu giao",
  PRODUCTION_DELIVERY_STATUS_INVALID: "Phiếu giao không còn ở trạng thái chờ nhận, hoặc yêu cầu còn phiếu giao chờ nhận",
  PRODUCTION_DELIVERY_EMPTY: "Phiếu giao phải có ít nhất một mặt hàng",
  PRODUCTION_DELIVERY_QTY_EXCEEDS: "Số giao vượt số còn lại của yêu cầu (đã tính các phiếu đang chờ nhận)",
  PRODUCTION_DELIVERY_RECEIVE_EXCEEDS: "Số nhận vượt số xưởng ghi trên phiếu giao",
  PRODUCTION_DELIVERY_ITEM_MISMATCH: "Mặt hàng không có trên phiếu giao này",
  PRODUCTION_DELIVERY_CODE_UNAVAILABLE: "Không tạo được mã phiếu giao, vui lòng thử lại",
  // Đóng hàng & giao hàng
  FULFILLMENT_ALREADY_EXISTS: "Đơn này đã có phiếu đóng hàng",
  FULFILLMENT_LOCATION_DENIED: "Bạn không thao tác được ở kho này",
  FULFILLMENT_NOT_FOUND: "Không tìm thấy phiếu đóng hàng",
  FULFILLMENT_ORDER_NOT_READY: "Đơn chưa sẵn sàng để đóng hàng",
  FULFILLMENT_MULTIPLE_SOURCES: "Hàng của đơn nằm ở nhiều kho - chuyển kho về một nơi rồi đóng hàng",
  FULFILLMENT_LINE_NO_SOURCE: "Có dòng hàng chưa có kho xuất - bổ sung kho xuất trước khi đóng hàng",
  FULFILLMENT_NOTHING_TO_PACK: "Đơn không có mặt hàng nào cần đóng gói",
  FULFILLMENT_PACKAGES_INCOMPLETE: "Chưa đóng đủ số kiện",
  FULFILLMENT_QTY_EXCEEDS: "Số lượng vượt quá số trên đơn",
  FULFILLMENT_STATUS_INVALID: "Phiếu đóng hàng không ở trạng thái phù hợp",
  FULFILLMENT_VERIFY_DENIED: "Chỉ người phụ trách đơn mới xác nhận được hàng đã đóng",
  CARRIER_WEBHOOK_INVALID: "Dữ liệu từ hãng vận chuyển không hợp lệ",
  SHIPMENT_FULFILLMENT_NOT_HANDED_OVER: "Hàng chưa được bàn giao",
  SHIPMENT_NOT_ASSIGNED: "Bạn không phải người giao đơn này",
  SHIPMENT_NOT_FOUND: "Không tìm thấy lần giao hàng",
  SHIPMENT_PROOF_REQUIRED: "Cần ít nhất một ảnh bằng chứng giao hàng",
  SHIPMENT_STATUS_INVALID: "Lần giao không ở trạng thái phù hợp",
  SHIPMENT_TRACKING_TAKEN: "Mã vận đơn đã tồn tại",
  SHIPMENT_ORDER_NOT_PACKED: "Đơn chưa đóng gói nên chưa giao cho đơn vị vận chuyển được",
  SHIPMENT_DRIVER_REQUIRED: "Giao nội bộ cần chọn shipper",
  SHIPMENT_DRIVER_INVALID: "Shipper phải là chủ shop, người phụ trách đơn, hoặc nhân viên có quyền giao hàng",
  SHIPMENT_DRIVER_NOT_ALLOWED: "Đơn giao qua đơn vị vận chuyển ngoài không gán shipper của shop",
  INVENTORY_LOCK_MISMATCH: "Số hàng đã khoá cho đơn không khớp - liên hệ quản lý kho để kiểm tra",
  ORDER_STEP_DENIED: "Chỉ chủ shop, người phụ trách đơn, hoặc người có quyền tại kho này mới làm được bước này",
  SHIPMENT_DELIVER_INTERNAL_ONLY: "Đơn giao qua đơn vị vận chuyển ngoài sẽ được hãng cập nhật, không xác nhận tay được",
  SHIPMENT_ORDER_NOT_SHIPPING: "Đơn chưa ở trạng thái Đang vận chuyển",
  ORDER_COLLECTION_AMOUNT_MISMATCH: "Số tiền thu phải đúng bằng số còn phải thu",
  ORDER_QR_PAYMENT_NOT_PENDING: "Khoản chuyển khoản QR không còn chờ - có thể khách vừa chuyển xong",
  // Hoàn hàng
  ORDER_RETURN_CONDITION_REQUIRED: "Cần chọn tình trạng cho từng dòng hàng hoàn",
  ORDER_RETURN_DENIED: "Chỉ người phụ trách đơn hoặc người có quyền mới tạo được đơn hoàn",
  ORDER_RETURN_EMPTY: "Đơn hoàn chưa có dòng nào",
  ORDER_RETURN_NOT_FOUND: "Không tìm thấy đơn hoàn",
  ORDER_RETURN_ORDER_NOT_RETURNABLE: "Hàng chưa rời cửa hàng - hãy huỷ đơn thay vì tạo đơn hoàn",
  ORDER_RETURN_QTY_EXCEEDS: "Số lượng hoàn vượt quá số đã bán",
  ORDER_RETURN_STATUS_INVALID: "Đơn hoàn không ở trạng thái phù hợp",
  // Kênh bán & thanh toán (Phase 2)
  CHANNEL_MAPPING_DUPLICATE: "Sản phẩm trên sàn này đã được nối với một SKU",
  CHANNEL_MAPPING_NOT_FOUND: "Không tìm thấy liên kết sản phẩm",
  PAYMENT_AMOUNT_EXCEEDS_DUE: "Số tiền vượt quá số còn phải thu",
  PAYMENT_NOT_FOUND: "Không tìm thấy khoản thanh toán",
  PAYMENT_REFUND_EXCEEDS_PAID: "Số tiền hoàn vượt quá số đã thu",
  PAYMENT_STATUS_INVALID: "Khoản thanh toán không ở trạng thái phù hợp",
  SALES_CHANNEL_ALREADY_CONNECTED: "Shop này đã được kết nối",
  SALES_CHANNEL_AUTH_FAILED: "Kết nối với sàn thất bại",
  SALES_CHANNEL_NOT_CONFIGURED: "Kết nối sàn chưa được cấu hình trên máy chủ",
  SALES_CHANNEL_NOT_FOUND: "Không tìm thấy kênh bán",
} as const;

export type ApiErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * Các mã nghĩa là "phiên đăng nhập không dùng được nữa" — dùng cho interceptor quyết định
 * có thử refresh token hay không. Trước đây chỗ đó so khớp đúng chuỗi
 * `"Invalid or expired token."`, tức là đổi một câu chữ là vòng refresh chết.
 */
export const TOKEN_EXPIRED_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  "SESSION_EXPIRED",
  "REFRESH_TOKEN_INVALID",
]);

/** Thân lỗi backend trả về, phần frontend thực sự đọc. */
interface ApiErrorBody {
  code?: string;
  message?: string;
  error?: string;
  /** Chi tiết đi kèm, hình dạng tuỳ mã lỗi - chỉ đọc qua type guard (vd. `shortStockLinesOf`). */
  errors?: unknown;
}

/** Lấy thân lỗi ra khỏi một lỗi axios bất kỳ. */
export function getApiErrorBody(error: unknown): ApiErrorBody | undefined {
  if (error instanceof AxiosError) return error.response?.data as ApiErrorBody;
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: ApiErrorBody } }).response?.data;
  }
  return undefined;
}

/** Câu tiếng Việt cho một mã lỗi, hoặc `undefined` nếu mã chưa có trong bảng. */
export function messageForCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return ERROR_MESSAGES[code as ApiErrorCode];
}

/** Một mặt hàng thiếu khi đóng gói. Khớp `ShortStockLine` của BE (`inventories.service.ts`, `lockStock`). */
export interface ShortStockLine {
  label: string;
  needed: number;
  onShelf: number;
}

/** Kiểm tra một phần tử `errors` có đúng hình dạng `ShortStockLine` không. */
function isShortStockLine(value: unknown): value is ShortStockLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.label === "string" && typeof v.needed === "number" && typeof v.onShelf === "number";
}

/**
 * Danh sách hàng thiếu trong lỗi `INSUFFICIENT_STOCK` của `POST /orders/:id/pack`.
 * Lỗi khác, hoặc `INSUFFICIENT_STOCK` không kèm chi tiết (vd. từ `deductStock`) → `[]`.
 */
export function shortStockLinesOf(error: unknown): ShortStockLine[] {
  const body = getApiErrorBody(error);
  if (body?.code !== "INSUFFICIENT_STOCK" || !Array.isArray(body.errors)) return [];
  return body.errors.filter(isShortStockLine);
}

/** A money difference the backend explains alongside its code: `{ held, amount, difference }`. */
export interface MoneyGap {
  held: number;
  amount: number;
  difference: number;
}

function moneyGapAt(error: unknown, code: ApiErrorCode, key: string): MoneyGap | null {
  const body = getApiErrorBody(error) as (ApiErrorBody & Record<string, unknown>) | undefined;
  if (body?.code !== code) return null;
  const gap = body[key] as Partial<MoneyGap> | undefined;
  if (typeof gap?.held !== "number" || typeof gap.amount !== "number") return null;
  return { held: gap.held, amount: gap.amount, difference: gap.amount - gap.held };
}

/** `ORDER_DEPOSIT_CHANGED` (A-8): the edit would move the deposit off the money already taken. */
export function depositChangeOf(error: unknown): MoneyGap | null {
  return moneyGapAt(error, "ORDER_DEPOSIT_CHANGED", "deposit");
}

/** `ORDER_REMITTANCE_AMOUNT_MISMATCH` (A-10): what the owner counted is not what the shipper collected. */
export function remittanceGapOf(error: unknown): MoneyGap | null {
  return moneyGapAt(error, "ORDER_REMITTANCE_AMOUNT_MISMATCH", "remittance");
}
