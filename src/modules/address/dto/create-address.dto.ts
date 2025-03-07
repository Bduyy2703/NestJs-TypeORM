import { DefaultValuePipe } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateAddressDto {
    @ApiProperty()
    @IsString()
    street: string;

    @ApiProperty()
    @IsString()
    city: string;
    
    @ApiProperty()
    @IsString()
    country: string;

    @IsBoolean()
    @IsOptional() 
    @ApiProperty({ default: false }) 
    isDefault : boolean 
}
