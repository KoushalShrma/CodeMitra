package com.codemitra.backend.service;

import com.codemitra.backend.model.EmailLogEntity;
import com.codemitra.backend.repository.EmailLogRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends transactional emails and stores send outcomes in email logs.
 */
@Service
public class EmailService {

    private final EmailLogRepository emailLogRepository;
    private final JavaMailSender javaMailSender;
    private final boolean mailEnabled;
    private final String fromEmail;
    private final String institutionLoginUrl;

    public EmailService(
            EmailLogRepository emailLogRepository,
            JavaMailSender javaMailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.from:no-reply@codemitra.local}") String fromEmail,
            @Value("${app.institution.login-url:http://localhost:5173/institution/login}") String institutionLoginUrl
    ) {
        this.emailLogRepository = emailLogRepository;
        this.javaMailSender = javaMailSender;
        this.mailEnabled = mailEnabled;
        this.fromEmail = fromEmail;
        this.institutionLoginUrl = institutionLoginUrl;
    }

    /**
     * Sends institution credential email and logs success/failure state.
     */
    @Transactional
    public EmailDispatchResult sendInstitutionCredentialsEmail(
            String recipientEmail,
            String ccEmail,
            String institutionName,
            String loginEmail,
            String temporaryPassword,
            Long institutionRequestId,
            Long institutionId
    ) {
        String subject = "Welcome to Code_Mitra — Your Institution Account is Ready";
        String body = buildCredentialsBody(institutionName, loginEmail, temporaryPassword);

        EmailLogEntity log = new EmailLogEntity();
        log.setRecipientEmail(recipientEmail);
        log.setCcEmail(ccEmail);
        log.setSubject(subject);
        log.setBody(body);
        log.setStatus("PENDING");
        log.setRelatedEntityType("INSTITUTION_REQUEST");
        log.setRelatedEntityId(institutionRequestId == null ? institutionId : institutionRequestId);
        log = emailLogRepository.save(log);

        try {
            if (mailEnabled) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipientEmail);
                if (ccEmail != null && !ccEmail.isBlank() && !ccEmail.equalsIgnoreCase(recipientEmail)) {
                    message.setCc(ccEmail);
                }
                message.setSubject(subject);
                message.setText(body);
                javaMailSender.send(message);
            }

            log.setStatus("SENT");
            log.setErrorMessage(null);
            log.setSentAt(LocalDateTime.now());
            emailLogRepository.save(log);
            return new EmailDispatchResult(true, log.getStatus(), null, log.getId());
        } catch (Exception ex) {
            log.setStatus("FAILED");
            log.setErrorMessage(ex.getMessage());
            emailLogRepository.save(log);
            return new EmailDispatchResult(false, log.getStatus(), ex.getMessage(), log.getId());
        }
    }

    private String buildCredentialsBody(String institutionName, String loginEmail, String temporaryPassword) {
        return "Hello,\n\n"
            + "Welcome to Code_Mitra. Your institution account is now approved and ready to use.\n\n"
            + "Institution name: " + institutionName + "\n"
            + "Login URL: " + institutionLoginUrl + "\n"
            + "Email: " + loginEmail + "\n"
            + "Temporary Password: " + temporaryPassword + "\n\n"
            + "Please change your password immediately after first login.\n\n"
            + "CodeMitra Team";
    }

    /**
     * Result payload for outbound email dispatch attempts.
     */
    public record EmailDispatchResult(
            boolean success,
            String status,
            String errorMessage,
            Long emailLogId
    ) {
    }
}