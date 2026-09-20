package com.app.logistics.common.utils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import com.app.logistics.common.exception.APIException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class Messenger {

    @Value("${spring.mail.username}")
    private String mailFrom;

    private final JavaMailSender javaMailSender;

    public Messenger(JavaMailSender javaMailSender){
        this.javaMailSender = javaMailSender;
    }

    public boolean mailSender(String mailTo, String mailSubject, String mailContent){

        try{
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();

            MimeMessageHelper messageHelper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            messageHelper.setFrom(mailFrom);
            messageHelper.setTo(mailTo);
            messageHelper.setSubject(mailSubject);
            messageHelper.setText(mailContent,true);
            messageHelper.addInline("plsLogo", new ClassPathResource("static/imgs/PLS.png"));
            javaMailSender.send(mimeMessage);
        }catch (MailException mailException) {
            mailException.printStackTrace(); // or use a real logger
            return false;
        }catch(MessagingException messagingException){
            throw new APIException("Unable to construct email message.", HttpStatus.BAD_REQUEST);
        }
        return true;
    }
}
