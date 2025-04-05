import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateInvoiceDto } from "./dto/invoice.dto";
import { InvoiceItem } from "./entity/invoiceItem.entity";
import { User } from "../users/entities/user.entity";
import { Address } from "../address/entity/address.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Invoice } from "./entity/invoice.entity";

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepository: Repository<ProductDetails>
  ) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    const { userId, productDetails, discountIds, address, paymentMethod, totalProductAmount, shippingFee, shippingFeeDiscount, productDiscount, finalTotal } = createInvoiceDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let addressEntity = await this.addressRepository.findOne({ where: { id: address.id } });
    if (!addressEntity) {
      addressEntity = this.addressRepository.create(address);
      await this.addressRepository.save(addressEntity);
    }

    const invoice = this.invoiceRepository.create({
      user,
      userId,
      address: addressEntity,
      addressId: addressEntity.id,
      paymentMethod,
      totalProductAmount,
      shippingFee,
      shippingFeeDiscount,
      productDiscount,
      finalTotal,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.invoiceRepository.save(invoice);

    for (const item of productDetails) {
      const productDetail = await this.productDetailsRepository.findOne({ where: { id: item.productDetailId } });
      if (!productDetail) throw new Error("Product not found");

      const invoiceItem = this.invoiceItemRepository.create({
        invoice,
        invoiceId: invoice.id,
        productDetail,
        productDetailId: productDetail.id,
        quantity: item.quantity,
        price: productDetail.product.finalPrice,
      });

      await this.invoiceItemRepository.save(invoiceItem);
    }

    return { message: "Invoice created successfully", invoiceId: invoice.id };
  }

  async getInvoiceById(id: number) {
    return this.invoiceRepository.findOne({
      where: { id },
      relations: ["user", "address", "items", "items.productDetail"],
    });
  }

  async getAllInvoices() {
    return this.invoiceRepository.find({ relations: ["user", "address", "items", "items.productDetail"] });
  }
}
