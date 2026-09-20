package com.app.logistics.common.utils;

import org.springframework.stereotype.Component;

@Component
public class MailMessage {

    final String resetPasswordContent = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#24292f;">
                <div style="max-width:640px;margin:40px auto;padding:0 20px;">
                    <div style="text-align:center;margin-bottom:25px;">
                        <div style="display:flex;flex-direction:row; justify-content:center; align-items:center; gap:1.5rem;">
                            <img src="cid:plsLogo" alt="Passage Logistics Systems" style="max-width:150px;height:auto;" />
                            <h2 style="font-size:32px;font-weight:bold;color:#24292f;">Passage Logistics Systems</h2>
                        </div>
                        <div style="font-size:16px;color:#57606a;margin-top:8px;">
                            Reset your password
                        </div>
                    </div>
            
                    <div style="border:1px solid #d0d7de;border-radius:6px;padding:30px;">
            
                        <h2 style="text-align:center;margin-top:0;color:#24292f;">
                            Password Reset
                        </h2>
            
                        <p style="font-size:16px;line-height:1.6;">
                            We received a request to reset your Passage Logistics Systems
                            account password.
                        </p>
            
                        <p style="font-size:16px;line-height:1.6;">
                            You can use the following button to reset your password:
                        </p>
            
                        <div style="text-align:center;margin:30px 0;">
                            <a href="http://localhost:8080/views/reset-password.html?emailId=%s"
                               style="display:inline-block;background-color:#238636;color:#ffffff;
                                      text-decoration:none;padding:12px 25px;border-radius:6px;
                                      font-size:16px;font-weight:bold;">
                                Reset your password
                            </a>
                        </div>
            
                        <p style="font-size:16px;line-height:1.6;">
                            If you did not request a password reset, you can safely ignore
                            this email.
                        </p>
            
                        <p style="font-size:16px;line-height:1.6;">
                            This password reset request will expire after 3 hours.
                        </p>
            
                        <p style="font-size:16px;line-height:1.6;margin-bottom:0;">
                            Thanks,<br>
                            The Passage Logistics Systems Team
                        </p>
            
                    </div>
            
                </div>
            </body>
            </html>
            """;

    final String shipmentTrackingContent = """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#24292f;">
            <div style="max-width:640px;margin:40px auto;padding:0 20px;">
                <div style="text-align:center;margin-bottom:25px;">
                    <div style="display:flex; flex-direction:row; justify-content:center; align-items:center; gap:1.5rem;">
                        <img src="cid:plsLogo" alt="Passage Logistics Systems" style="max-width:150px;height:auto;" />
                        <h2 style="font-size:32px;font-weight:bold;color:#24292f;">Passage Logistics Systems</h2>
                    </div>
                    <div style="font-size:16px;color:#57606a;margin-top:8px;">
                        Shipment Tracking Information
                    </div>
                </div>

                <div style="border:1px solid #d0d7de;border-radius:6px;padding:30px;">

                    <h2 style="text-align:center;margin-top:0;color:#24292f;">
                        Shipment Tracking ID
                    </h2>

                    <p style="font-size:16px;line-height:1.6;">
                        Your shipment has been successfully registered with
                        Passage Logistics Systems.
                    </p>

                    <p style="font-size:16px;line-height:1.6;">
                        Your shipment tracking ID is:
                    </p>

                    <div style="text-align:center;margin:25px 0;">
                        <span style="font-size:24px;font-weight:bold;color:#24292f;">
                            %s
                        </span>
                    </div>

                    <p style="font-size:16px;line-height:1.6;">
                        Please keep this tracking ID safe. You can use it to
                        track the status of your shipment.
                    </p>

                    <p style="font-size:16px;line-height:1.6;margin-bottom:0;">
                        Thanks,<br>
                        The Passage Logistics Systems Team
                    </p>

                </div>

            </div>
        </body>
        </html>
        """;



    public String getResetPasswordContent(String emailId) {
        return resetPasswordContent.formatted(emailId);
    }


    public String getShipmentTrackingIdContent(String trackingId) {
        return shipmentTrackingContent.formatted(trackingId);
    }
}
