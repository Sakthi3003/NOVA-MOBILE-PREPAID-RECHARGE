package com.nova.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.nova.exception.PdfGenerationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.util.Map;

@Service
public class PdfGeneratorService {
    private static final Logger logger = LoggerFactory.getLogger(PdfGeneratorService.class);

    public ByteArrayOutputStream generateInvoice(Map<String, Object> invoiceData) {
        logger.info("Starting PDF invoice generation");
        validateInvoiceData(invoiceData);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = null;

        try {
            document = new Document(PageSize.A4, 20, 20, 20, 20);
            PdfWriter.getInstance(document, baos);
            document.open();

            addInvoiceContent(document, invoiceData);

            logger.info("Successfully generated PDF invoice");
            return baos;
        } catch (DocumentException e) {
            logger.error("Failed to generate PDF due to DocumentException: {}", e.getMessage(), e);
            throw new PdfGenerationException("Failed to generate PDF invoice due to document error", e);
        } catch (Exception e) {
            logger.error("Unexpected error while generating PDF: {}", e.getMessage(), e);
            throw new PdfGenerationException("Unexpected error while generating PDF invoice", e);
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
                logger.debug("Document closed successfully");
            }
        }
    }

    private void addInvoiceContent(Document document, Map<String, Object> invoiceData) throws DocumentException {
        // Fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
        Font sectionTitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Font labelFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 12);
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 10);

        // --- Header Section
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1, 1});

        PdfPCell logoCell = new PdfPCell();
        try {
            logger.debug("Loading logo from URL: http://localhost:5501/assets/images/logo.webp");
            Image logo = Image.getInstance(new URL("http://localhost:5501/assets/images/logo.webp"));
            logo.scaleToFit(190, 60);
            logoCell.addElement(logo);
        } catch (Exception e) {
            logger.warn("Failed to load logo image: {}", e.getMessage());
            logoCell.addElement(new Paragraph("NOVA", normalFont));
        }
        logoCell.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(logoCell);

        PdfPCell titleCell = new PdfPCell(new Paragraph("PAYMENT RECEIPT", titleFont));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        headerTable.addCell(titleCell);

        document.add(headerTable);
        document.add(Chunk.NEWLINE);

        // --- Metadata Section ---
        PdfPTable metaTable = new PdfPTable(3);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 1, 1});

        metaTable.addCell(createCell("Receipt No.", labelFont, true));
        metaTable.addCell(createCell("Transaction Date", labelFont, true));
        metaTable.addCell(createCell("Payment Mode", labelFont, true));

        metaTable.addCell(createCell(invoiceData.get("invoiceId").toString(), normalFont, false));
        metaTable.addCell(createCell(invoiceData.get("transactionDate").toString(), normalFont, false));
        metaTable.addCell(createCell(invoiceData.get("paymentMode").toString(), normalFont, false));

        document.add(metaTable);
        document.add(Chunk.NEWLINE);

        // --- Customer Details Section ---
        document.add(new Paragraph("CUSTOMER DETAILS", sectionTitleFont));
        document.add(new Paragraph(" ", normalFont));

        PdfPTable customerTable = new PdfPTable(2);
        customerTable.setWidthPercentage(100);
        customerTable.setWidths(new float[]{30, 70});

        customerTable.addCell(createCell("Customer Name", labelFont, true));
        customerTable.addCell(createCell(invoiceData.get("userName").toString(), normalFont, false));

        customerTable.addCell(createCell("Mobile Number", labelFont, true));
        customerTable.addCell(createCell(invoiceData.get("phoneNumber").toString(), normalFont, false));

        document.add(customerTable);
        document.add(Chunk.NEWLINE);

        // --- Plan Details Section ---
        document.add(new Paragraph("PLAN DETAILS", sectionTitleFont));
        document.add(new Paragraph(" ", normalFont));

        PdfPTable planTable = new PdfPTable(5);
        planTable.setWidthPercentage(100);
        planTable.setWidths(new float[]{20, 20, 20, 20, 20});

        planTable.addCell(createCell("Pack Description", labelFont, true));
        planTable.addCell(createCell("Data", labelFont, true));
        planTable.addCell(createCell("Validity", labelFont, true));
        planTable.addCell(createCell("Voice", labelFont, true));
        planTable.addCell(createCell("SMS", labelFont, true));

        planTable.addCell(createCell(invoiceData.get("planName").toString(), normalFont, false));
        planTable.addCell(createCell(invoiceData.get("data").toString(), normalFont, false));
        planTable.addCell(createCell(invoiceData.get("validity").toString(), normalFont, false));
        planTable.addCell(createCell(invoiceData.get("calls").toString(), normalFont, false));
        planTable.addCell(createCell(invoiceData.get("sms").toString(), normalFont, false));

        document.add(planTable);
        document.add(Chunk.NEWLINE);

        // --- Payment Details Section ---
        document.add(new Paragraph("PAYMENT DETAILS", sectionTitleFont));
        document.add(new Paragraph(" ", normalFont));

        PdfPTable paymentTable = new PdfPTable(2);
        paymentTable.setWidthPercentage(100);
        paymentTable.setWidths(new float[]{70, 30});

        paymentTable.addCell(createCell("Description", labelFont, true));
        paymentTable.addCell(createCell("Amount (₹)", labelFont, true));

        paymentTable.addCell(createCell("Base Pack Amount", normalFont, false));
        paymentTable.addCell(createCell(String.format("%.2f", invoiceData.get("planPrice")), normalFont, false));

        paymentTable.addCell(createCell("GST (18%)", normalFont, false));
        paymentTable.addCell(createCell(String.format("%.2f", invoiceData.get("gst")), normalFont, false));

        PdfPCell totalDescCell = createCell("Total Amount", labelFont, false);
        totalDescCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        paymentTable.addCell(totalDescCell);

        PdfPCell totalAmountCell = createCell(String.format("%.2f", invoiceData.get("totalAmount")), labelFont, false);
        totalAmountCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        paymentTable.addCell(totalAmountCell);

        document.add(paymentTable);
        document.add(Chunk.NEWLINE);

        // --- Footer with Signature ---
        PdfPTable signatureTable = new PdfPTable(1);
        signatureTable.setWidthPercentage(50);
        signatureTable.setHorizontalAlignment(Element.ALIGN_CENTER);

        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBorder(Rectangle.BOX);
        signatureCell.setPadding(10);

        signatureCell.addElement(new Paragraph("Digitally signed by Mobi Comm Service Limited", normalFont));
        signatureCell.addElement(new Paragraph("Date: 2025.02.27", normalFont));
        signatureCell.addElement(new Paragraph("Reason: Invoice", normalFont));
        signatureCell.addElement(new Paragraph("Time: " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()) + " IST", normalFont));

        signatureTable.addCell(signatureCell);
        document.add(signatureTable);
        document.add(Chunk.NEWLINE);

        // --- Footer Text ---
        Paragraph footer = new Paragraph("Thank you for choosing Nova. For any assistance, please contact our customer support.", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        footer = new Paragraph("Email: support@nova.com | Helpline: +91 987654321", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        footer = new Paragraph("© 2025 Mobi Comm Service Limited. All rights reserved.", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private PdfPCell createCell(String content, Font font, boolean isHeader) {
        if (content == null) {
            logger.warn("Cell content is null, defaulting to empty string");
            content = "";
        }
        PdfPCell cell = new PdfPCell(new Paragraph(content, font));
        cell.setPadding(5);
        if (isHeader) {
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        }
        return cell;
    }

    private void validateInvoiceData(Map<String, Object> invoiceData) {
        logger.debug("Validating invoice data");

        if (invoiceData == null || invoiceData.isEmpty()) {
            logger.error("Invoice data is null or empty");
            throw new IllegalArgumentException("Invoice data cannot be null or empty");
        }

        String[] requiredFields = {"invoiceId", "transactionDate", "paymentMode", "userName", "phoneNumber",
                "planName", "data", "validity", "calls", "sms", "planPrice", "gst", "totalAmount"};
        for (String field : requiredFields) {
            if (!invoiceData.containsKey(field) || invoiceData.get(field) == null) {
                logger.error("Required field '{}' is missing or null in invoice data", field);
                throw new IllegalArgumentException("Required field '" + field + "' is missing or null in invoice data");
            }
        }

        // Validate numeric fields
        try {
            Double.parseDouble(invoiceData.get("planPrice").toString());
            Double.parseDouble(invoiceData.get("gst").toString());
            Double.parseDouble(invoiceData.get("totalAmount").toString());
        } catch (NumberFormatException e) {
            logger.error("Invalid numeric value in invoice data: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid numeric value in invoice data (planPrice, gst, or totalAmount)", e);
        }
    }
}