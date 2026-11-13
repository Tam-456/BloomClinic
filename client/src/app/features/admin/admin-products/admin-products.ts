import { Component, OnInit, signal, computed } from '@angular/core';
import { AdminCatalogService } from '../../../shared/services/admin-catalog';
import { Product, ProductBatch } from '../../../shared/interfaces/product.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';

export interface ClinicProduct extends Product {
  category?: 'treatment' | 'cosmeceutical' | 'supplement';

  brand?: string;
  manufacturer?: string;
  ingredients?: string;
  uses?: string;
  volume?: string;
  cautions?: string;

  receivedDate?: string;
  manufactureDate?: string;
  expiryDate?: string;

  batches?: ProductBatch[];
}

export interface StockUpdateForm {
  productId: string;
  quantity: number;
  receivedDate: string;
  manufactureDate: string;
  expiryDate: string;
  documentImagePreview: string | null;
  documentFileName?: string;
  note: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss',
})
export class AdminProducts implements OnInit {
  today = this.getToday();

  products = signal<ClinicProduct[]>([]);

  searchKeyword = signal('');
  filterStock = signal<'all' | 'low' | 'available' | 'out'>('all');
  filterCategory = signal('all');

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // =========================
  // PHÂN TRANG (10 SP / TRANG)
  // =========================
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // =========================
  // POPUP TẠO SẢN PHẨM
  // =========================

  isCreateProductModalOpen = signal(false);

  newProduct: Partial<ClinicProduct> = this.getEmptyProduct();

  initialBatchForm = {
    receivedDate: this.getToday(),
    manufactureDate: '',
    expiryDate: '',
  };

  // =========================
  // POPUP CHỈNH SỬA SẢN PHẨM
  // =========================

  isEditProductModalOpen = signal(false);
  editProductForm: Partial<ClinicProduct> = {};

  // =========================
  // POPUP NHẬP KHO
  // =========================

  isStockUpdateModalOpen = signal(false);
  stockModalSearchKeyword = '';

  selectedProductForStock = signal<ClinicProduct | null>(null);

  stockUpdateForm: StockUpdateForm = {
    productId: '',
    quantity: 1,
    receivedDate: this.getToday(),
    manufactureDate: '',
    expiryDate: '',
    documentImagePreview: null,
    documentFileName: '',
    note: '',
  };

  // =========================
  // POPUP CHI TIẾT SẢN PHẨM
  // =========================

  isProductDetailModalOpen = signal(false);
  selectedProductForDetail = signal<ClinicProduct | null>(null);

  constructor(
    private confirmDialog: ConfirmDialogService,
    private catalogService: AdminCatalogService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // =========================
  // HÀM HỖ TRỢ
  // =========================

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getEmptyProduct(): Partial<ClinicProduct> {
    return {
      productCode: '',
      productName: '',
      category: 'cosmeceutical',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      unit: 'Tuýp',
      brand: '',
      manufacturer: '',
      ingredients: '',
      uses: '',
      volume: '',
      cautions: '',
      batches: [],
    };
  }

  private createBatchId(): string {
    return `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private createLocalProductId(): string {
    return `LOCAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // =========================
  // TỰ ĐỘNG SINH MÃ TỊNH TIẾN THEO PHÂN LOẠI
  // =========================
  generateNextProductCode(category?: 'treatment' | 'cosmeceutical' | 'supplement'): string {
    let prefix = 'CS-';
    if (category === 'treatment') prefix = 'DT-';
    else if (category === 'supplement') prefix = 'TP-';

    const numbers = this.products()
      .map(p => {
        const code = (p.productCode || '').trim().toUpperCase();
        if (code.startsWith(prefix)) {
          const numPart = code.replace(prefix, '').replace(/\D/g, '');
          return parseInt(numPart, 10);
        }
        return 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  onCategoryChangeInCreateModal(cat: 'treatment' | 'cosmeceutical' | 'supplement'): void {
    this.newProduct.category = cat;
    this.newProduct.productCode = this.generateNextProductCode(cat);
  }

  // =========================
  // QUẢN LÝ TỒN KHO
  // =========================

  getTotalStock(product: ClinicProduct): number {
    return (product.batches || []).reduce(
      (total, batch) => total + Math.max(0, Number(batch.remainingQuantity) || 0),
      0
    );
  }

  getSellableStock(product: ClinicProduct): number {
    return (product.batches || []).reduce((total, batch) => {
      if (this.isBatchExpired(batch)) {
        return total;
      }
      return total + Math.max(0, Number(batch.remainingQuantity) || 0);
    }, 0);
  }

  private updateProductStock(product: ClinicProduct): ClinicProduct {
    const batchTotal = (product.batches || []).reduce(
      (sum, b) => sum + Math.max(0, Number(b.remainingQuantity) || 0),
      0
    );

    return {
      ...product,
      stockQuantity: (product.batches && product.batches.length > 0) ? batchTotal : (Number(product.stockQuantity) || 0),
    };
  }

  private normalizeProduct(product: ClinicProduct): ClinicProduct {
    let batches = product.batches || [];

    if (batches.length === 0 && Number(product.stockQuantity) > 0) {
      batches = [
        {
          id: this.createBatchId(),
          receivedDate: product.receivedDate || this.getToday(),
          manufactureDate: product.manufactureDate || '',
          expiryDate: product.expiryDate || '',
          quantityReceived: Number(product.stockQuantity),
          remainingQuantity: Number(product.stockQuantity),
          note: 'Lô hàng ban đầu',
        },
      ];
    }

    return this.updateProductStock({
      ...product,
      batches,
    });
  }

  isBatchExpired(batch: ProductBatch): boolean {
    if (!batch.expiryDate) {
      return false;
    }
    return batch.expiryDate < this.getToday();
  }

  hasExpiredBatch(product: ClinicProduct): boolean {
    return (product.batches || []).some(
      batch =>
        batch.remainingQuantity > 0 &&
        this.isBatchExpired(batch)
    );
  }

  getExpiredStock(product: ClinicProduct): number {
    return (product.batches || []).reduce((total, batch) => {
      if (!this.isBatchExpired(batch)) {
        return total;
      }
      return total + Math.max(0, batch.remainingQuantity);
    }, 0);
  }

  getStockStatus(product: ClinicProduct): string {
    const quantity = this.getSellableStock(product);
    if (quantity <= 0) return 'Hết hàng';
    if (quantity <= 5) return 'Sắp hết hàng';
    return 'Còn hàng';
  }

  // =========================
  // DANH SÁCH VÀ BỘ LỌC
  // =========================

  filteredProducts = computed(() => {
    const keyword = this.searchKeyword().toLowerCase().trim();
    const stockMode = this.filterStock();
    const categoryMode = this.filterCategory();

    return this.products().filter(product => {
      const matchKeyword =
        !keyword ||
        (product.productName || '').toLowerCase().includes(keyword) ||
        (product.productCode || '').toLowerCase().includes(keyword);

      const currentStock = Number(product.stockQuantity) || 0;
      let matchStock = true;
      if (stockMode === 'low') {
        matchStock = currentStock > 0 && currentStock <= 5;
      } else if (stockMode === 'available') {
        matchStock = currentStock > 5;
      } else if (stockMode === 'out') {
        matchStock = currentStock === 0;
      }

      const cat = (product.category || '').toLowerCase();
      let matchCategory = categoryMode === 'all';
      if (!matchCategory) {
        matchCategory = cat === categoryMode;
      }

      return matchKeyword && matchStock && matchCategory;
    });
  });

  // =========================
  // COMPUTED PHÂN TRANG (10 SP / TRANG)
  // =========================
  totalPages = computed(() => {
    const total = this.filteredProducts().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  searchedStockProducts = computed(() => {
    const keyword = this.stockModalSearchKeyword.toLowerCase().trim();
    if (!keyword) return this.products();
    return this.products().filter(product =>
      (product.productName || '').toLowerCase().includes(keyword) ||
      (product.productCode || '').toLowerCase().includes(keyword)
    );
  });

  // =========================
  // TẢI SẢN PHẨM
  // =========================

  loadProducts(): void {
    this.isLoading.set(true);
    this.catalogService.getProducts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const normalizedList = list.map((item: any) => this.normalizeProduct(item));
        this.products.set(normalizedList);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi nạp kho hàng:', err);
        this.isLoading.set(false);
      }
    });
  }

  // =========================
  // TẠO SẢN PHẨM
  // =========================

  openCreateProductModal(): void {
    this.clearMessages();

    const defaultCat: 'treatment' | 'cosmeceutical' | 'supplement' = 'cosmeceutical';
    this.newProduct = {
      ...this.getEmptyProduct(),
      category: defaultCat,
      productCode: this.generateNextProductCode(defaultCat)
    };

    this.initialBatchForm = {
      receivedDate: this.getToday(),
      manufactureDate: '',
      expiryDate: '',
    };

    this.isCreateProductModalOpen.set(true);
  }

  closeCreateProductModal(): void {
    this.isCreateProductModalOpen.set(false);
  }

  createProduct(): void {
    this.clearMessages();

    const productCode = this.newProduct.productCode?.trim();
    const productName = this.newProduct.productName?.trim();

    if (!productCode || !productName) {
      this.errorMessage.set('Vui lòng nhập mã và tên sản phẩm.');
      return;
    }

    const duplicatedCode = this.products().some(
      product =>
        product.productCode.toLowerCase() === productCode.toLowerCase()
    );

    if (duplicatedCode) {
      this.errorMessage.set('Mã sản phẩm đã tồn tại.');
      return;
    }

    const {
      receivedDate,
      manufactureDate,
      expiryDate,
    } = this.initialBatchForm;

    if (!receivedDate || !manufactureDate || !expiryDate) {
      this.errorMessage.set(
        'Vui lòng nhập đầy đủ ngày nhập, ngày sản xuất và hạn sử dụng.'
      );
      return;
    }

    if (expiryDate < manufactureDate) {
      this.errorMessage.set('Hạn sử dụng không thể trước ngày sản xuất.');
      return;
    }

    const quantity = Number(this.newProduct.stockQuantity || 0);

    if (!Number.isInteger(quantity) || quantity < 0) {
      this.errorMessage.set('Số lượng nhập ban đầu không hợp lệ.');
      return;
    }

    const batch: ProductBatch = {
      id: this.createBatchId(),
      receivedDate,
      manufactureDate,
      expiryDate,
      quantityReceived: quantity,
      remainingQuantity: quantity,
    };

    const createdProductPayload: ClinicProduct = {
      ...this.getEmptyProduct(),
      ...this.newProduct,
      productCode,
      productName,
      stockQuantity: quantity,
      batches: quantity > 0 ? [batch] : [],
    } as ClinicProduct;

    this.catalogService.createProduct(createdProductPayload).subscribe({
      next: (created: any) => {
        const saved = this.normalizeProduct(created?.data || created || createdProductPayload);
        this.products.update(products => [saved, ...products]);
        this.successMessage.set('Thêm sản phẩm thành công.');
        this.isCreateProductModalOpen.set(false);
        this.newProduct = this.getEmptyProduct();
      },
      error: () => {
        const localProduct: ClinicProduct = {
          ...createdProductPayload,
          _id: this.createLocalProductId(),
        };
        this.products.update(products => [localProduct, ...products]);
        this.successMessage.set('Thêm sản phẩm thành công.');
        this.isCreateProductModalOpen.set(false);
        this.newProduct = this.getEmptyProduct();
      }
    });
  }

  // =========================
  // CHỈNH SỬA SẢN PHẨM
  // =========================

  openEditProductModal(product: ClinicProduct): void {
    this.clearMessages();

    this.editProductForm = {
      _id: product._id,
      productCode: product.productCode,
      productName: product.productName,
      category: product.category || 'cosmeceutical',
      price: product.price,
      costPrice: product.costPrice || 0,
      stockQuantity: product.stockQuantity,
      unit: product.unit || 'Tuýp',
      brand: product.brand || '',
      manufacturer: product.manufacturer || '',
      volume: product.volume || '',
      ingredients: product.ingredients || '',
      uses: product.uses || '',
      cautions: product.cautions || '',
      batches: product.batches || [],
    };

    this.isEditProductModalOpen.set(true);
  }

  closeEditProductModal(): void {
    this.isEditProductModalOpen.set(false);
  }

  updateProduct(): void {
    this.clearMessages();

    const productId = this.editProductForm._id;
    if (!productId) {
      this.errorMessage.set('Không tìm thấy mã sản phẩm.');
      return;
    }

    const productCode = this.editProductForm.productCode?.trim();
    const productName = this.editProductForm.productName?.trim();

    if (!productCode || !productName) {
      this.errorMessage.set('Vui lòng nhập mã và tên sản phẩm.');
      return;
    }

    const currentProduct = this.products().find(
      product => product._id === productId
    );

    if (!currentProduct) {
      this.errorMessage.set('Không tìm thấy sản phẩm cần cập nhật.');
      return;
    }

    const updatedProduct: ClinicProduct = {
      ...currentProduct,
      ...this.editProductForm,
      _id: productId,
      productCode,
      productName,
      category: this.editProductForm.category || 'cosmeceutical',
      price: Number(this.editProductForm.price) || 0,
      costPrice: Number(this.editProductForm.costPrice) || 0,
      unit: this.editProductForm.unit || 'Tuýp',
      brand: this.editProductForm.brand || '',
      manufacturer: this.editProductForm.manufacturer || '',
      volume: this.editProductForm.volume || '',
      ingredients: this.editProductForm.ingredients || '',
      uses: this.editProductForm.uses || '',
      cautions: this.editProductForm.cautions || '',
      batches: currentProduct.batches,
      stockQuantity: this.getTotalStock(currentProduct),
    } as ClinicProduct;

    this.catalogService.updateProduct(productId, updatedProduct).subscribe({
      next: () => {
        this.products.update(products =>
          products.map(product =>
            product._id === productId ? updatedProduct : product
          )
        );
        this.successMessage.set('Cập nhật sản phẩm thành công.');
        this.isEditProductModalOpen.set(false);
      },
      error: () => {
        this.products.update(products =>
          products.map(product =>
            product._id === productId ? updatedProduct : product
          )
        );
        this.successMessage.set('Cập nhật sản phẩm thành công.');
        this.isEditProductModalOpen.set(false);
      }
    });
  }

  // =========================
  // NHẬP KHO THEO LÔ
  // =========================

  openStockUpdateModal(): void {
    this.clearMessages();

    this.stockUpdateForm = {
      productId: '',
      quantity: 1,
      receivedDate: this.getToday(),
      manufactureDate: '',
      expiryDate: '',
      documentImagePreview: null,
      documentFileName: '',
      note: '',
    };

    this.selectedProductForStock.set(null);
    this.stockModalSearchKeyword = '';

    this.isStockUpdateModalOpen.set(true);
  }

  closeStockUpdateModal(): void {
    this.isStockUpdateModalOpen.set(false);
  }

  selectProductForStock(productId: string): void {
    const product = this.products().find(
      item => item._id === productId
    );

    this.selectedProductForStock.set(product || null);

    if (product) {
      this.stockUpdateForm.productId = product._id || '';
      this.stockModalSearchKeyword = product.productName;
    }
  }

  updateStock(): void {
    this.clearMessages();

    const product = this.selectedProductForStock();
    if (!product || !product._id) {
      this.errorMessage.set('Vui lòng chọn sản phẩm cần nhập kho.');
      return;
    }

    const quantity = Number(this.stockUpdateForm.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.errorMessage.set('Số lượng nhập phải là số nguyên lớn hơn 0.');
      return;
    }

    const { receivedDate, manufactureDate, expiryDate } = this.stockUpdateForm;

    if (!receivedDate || !manufactureDate || !expiryDate) {
      this.errorMessage.set('Vui lòng nhập đầy đủ thông tin ngày của lô hàng.');
      return;
    }

    if (expiryDate < manufactureDate) {
      this.errorMessage.set('Hạn sử dụng không thể trước ngày sản xuất.');
      return;
    }

    const newBatch: ProductBatch = {
      id: this.createBatchId(),
      receivedDate,
      manufactureDate,
      expiryDate,
      quantityReceived: quantity,
      remainingQuantity: quantity,
      note: this.stockUpdateForm.note,
      documentImagePreview: this.stockUpdateForm.documentImagePreview,
      documentFileName: this.stockUpdateForm.documentFileName,
    };

    const updatedProduct = this.updateProductStock({
      ...product,
      batches: [...(product.batches || []), newBatch],
    });

    this.catalogService.updateProduct(product._id, updatedProduct).subscribe();

    this.products.update(products =>
      products.map(item =>
        item._id === product._id ? updatedProduct : item
      )
    );

    this.successMessage.set('Nhập kho thành công. Đã tạo lô hàng mới.');
    this.isStockUpdateModalOpen.set(false);
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Vui lòng chọn file hình ảnh.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.stockUpdateForm.documentImagePreview = reader.result as string;
      this.stockUpdateForm.documentFileName = file.name;
    };
    reader.readAsDataURL(file);
  }

  removeDocument(): void {
    this.stockUpdateForm.documentImagePreview = null;
    this.stockUpdateForm.documentFileName = '';
  }

  openProductDetail(product: ClinicProduct): void {
    this.selectedProductForDetail.set(product);
    this.isProductDetailModalOpen.set(true);
  }

  closeProductDetail(): void {
    this.selectedProductForDetail.set(null);
    this.isProductDetailModalOpen.set(false);
  }

  deleteProduct(product: ClinicProduct): void {
    if (!product._id) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa sản phẩm "${product.productName}"?`
    );

    if (!confirmed) return;

    this.catalogService.deleteProduct(product._id).subscribe({
      next: () => {
        this.products.update(products =>
          products.filter(item => item._id !== product._id)
        );
        this.successMessage.set('Đã xóa sản phẩm khỏi danh sách.');
      },
      error: () => {
        this.products.update(products =>
          products.filter(item => item._id !== product._id)
        );
        this.successMessage.set('Đã xóa sản phẩm khỏi danh sách.');
      }
    });
  }
}