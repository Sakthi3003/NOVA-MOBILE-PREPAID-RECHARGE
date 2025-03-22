package com.nova.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfGeneratorService {

    public ByteArrayOutputStream generateInvoice(Map<String, Object> invoiceData) throws DocumentException {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter.getInstance(document, out);
        document.open();

        // Add Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
        Paragraph title = new Paragraph("Invoice", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" "));

        // Add Invoice Details
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1, 2});

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
        table.addCell(new PdfPCell(new Phrase("Invoice ID:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("invoiceId").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Transaction ID:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("transactionId").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("User Name:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("userName").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Phone Number:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("phoneNumber").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Plan Name:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("planName").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Plan Price:", cellFont)));
        table.addCell(new PdfPCell(new Phrase("₹" + invoiceData.get("planPrice").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("GST (18%):", cellFont)));
        table.addCell(new PdfPCell(new Phrase("₹" + invoiceData.get("gst").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Total Amount:", cellFont)));
        table.addCell(new PdfPCell(new Phrase("₹" + invoiceData.get("totalAmount").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Transaction Date:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("transactionDate").toString(), cellFont)));
        table.addCell(new PdfPCell(new Phrase("Payment Mode:", cellFont)));
        table.addCell(new PdfPCell(new Phrase(invoiceData.get("paymentMode").toString(), cellFont)));

        document.add(table);
        document.close();

        return out;
    }
}
