import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly mailUser: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (!host || !user || !pass || !Number.isInteger(port)) {
      throw new Error(
        'Thiếu cấu hình MAIL_HOST, MAIL_PORT, MAIL_USER hoặc MAIL_PASS',
      );
    }

    this.mailUser = user;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const safeEmail = escapeHtml(to);
    const safeToken = escapeHtml(token);

    try {
      await this.transporter.sendMail({
        from: `"Hệ thống Phòng Học" <${this.mailUser}>`,
        to,
        subject: 'Khôi phục mật khẩu - Cổng thông tin Đại học Quy Nhơn',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Yêu cầu khôi phục mật khẩu</h2>
            <p>Chào bạn, hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản <b>${safeEmail}</b>.</p>
            <p>Mã khôi phục của bạn là: <strong style="font-size: 24px; color: red;">${safeToken}</strong></p>
            <p>Mã này sẽ hết hạn sau 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          </div>
        `,
      });
      this.logger.log(`Đã gửi email khôi phục mật khẩu tới ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Lỗi gửi email: ${message}`);
      throw new Error('Không thể gửi email khôi phục');
    }
  }

  async sendCheckInEmail(
      to: string,
      roomName: string,
      startTime: string,
      bookingId: string,
    ): Promise<void> {
      const safeRoomName = escapeHtml(roomName);
      const safeStartTime = escapeHtml(startTime);
      try {
        await this.transporter.sendMail({
          from: `"Hệ thống Phòng Học" <${this.mailUser}>`,
          to,
          subject: 'Xác nhận sử dụng phòng học',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #1e3a8a;">Đã đến giờ sử dụng phòng!</h2>
              <p>Lượt đặt phòng <b>${safeRoomName}</b> đã bắt đầu lúc <b>${safeStartTime}</b>.</p>
              <p>Vui lòng mở hệ thống để xác nhận bạn đang có mặt tại phòng.
              <b>Nếu không xác nhận trong vòng 15 phút, lượt đặt sẽ bị tự động hủy.</b></p>
              <a href="http://localhost:5173/student" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Xác nhận sử dụng ngay</a>
            </div>
          `,
        });
        this.logger.log(`Đã gửi email xác nhận cho booking ${bookingId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Lỗi gửi email xác nhận: ${message}`);
      }
    }

  async sendReminderEmail(
    to: string,
    roomName: string,
    endTime: string,
  ): Promise<void> {
    const safeRoomName = escapeHtml(roomName);
    const safeEndTime = escapeHtml(endTime);

    try {
      await this.transporter.sendMail({
        from: `"Hệ thống Phòng Học" <${this.mailUser}>`,
        to,
        subject: 'Nhắc nhở: Sắp hết giờ sử dụng phòng',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #f59e0b;">Sắp hết giờ sử dụng phòng!</h2>
            <p>Lượt đặt phòng <b>${safeRoomName}</b> của bạn sẽ kết thúc lúc <b>${safeEndTime}</b> (còn khoảng 10 phút nữa).</p>
            <p>Vui lòng truy cập hệ thống để chọn <b>Gia hạn</b> nếu muốn dùng tiếp hoặc kết thúc sử dụng phòng.</p>
            <a href="http://localhost:5173/student" style="display: inline-block; padding: 10px 20px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px;">Truy cập hệ thống</a>
          </div>
        `,
      });
      this.logger.log(`Đã gửi email nhắc hết giờ tới ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Lỗi gửi email nhắc hết giờ: ${message}`);
    }
  }
}
