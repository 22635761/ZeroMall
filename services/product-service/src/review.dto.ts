export class CreateReviewDto {
  username: string;
  rating: number;
  comment: string;
  variant: string;
  images?: string;   // JSON array of Cloudinary URLs
  orderId?: string;  // Link to order
}
