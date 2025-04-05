import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/invoice.dto";

@Controller("invoices")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.createInvoice(createInvoiceDto);
  }

  @Get(":id")
  async getInvoiceById(@Param("id") id: number) {
    return this.invoiceService.getInvoiceById(id);
  }

  @Get()
  async getAllInvoices() {
    return this.invoiceService.getAllInvoices();
  }
}
