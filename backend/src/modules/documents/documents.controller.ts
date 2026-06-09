/**
 * DocumentsController — /v1/documents and its nested signature-requests. — arch §6.10
 * Upload + request-signature require documents:create; reads require documents:view (visibility-scoped).
 */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { UploadedFile as UploadedFileShape } from '../../common/storage/storage.service';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { ListDocumentsQuery } from './dto/list-documents.query';
import { DocumentResponse, FileUrlResponse, SignatureRequestResponse } from './dto/document.response';

const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25 MB

@ApiTags('Documents & E-Signature')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @RequirePermission('documents', 'create')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOC_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        doc_type: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a document (PDF)',
    description:
      'Requires documents:create. Multipart: a PDF file + title + doc_type. Stored to object storage ' +
      '(the original is never mutated); status draft, owner = caller. Non-PDF → 422 (save as PDF first).',
  })
  @ApiCreatedResponse({ type: DocumentResponse })
  upload(
    @Body() dto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'application/pdf' })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory: () =>
            new UnprocessableEntityException('a PDF file is required (save Word documents as PDF first)'),
        }),
    )
    file: UploadedFileShape,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.upload(dto, file, user);
  }

  @Get(':id/file-url')
  @RequirePermission('documents', 'view')
  @ApiOperation({
    summary: 'Get an access-controlled URL for the original document',
    description: 'Requires documents:view + visibility. Returns a short-TTL signed URL for preview/download.',
  })
  @ApiOkResponse({ type: FileUrlResponse })
  fileUrl(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.documents.fileUrl(id, user);
  }

  @Get(':id/completed-file-url')
  @RequirePermission('documents', 'view')
  @ApiOperation({
    summary: 'Get an access-controlled URL for the final all-signatures copy',
    description: 'Requires documents:view + visibility. 404 until the request completes (DOC-005).',
  })
  @ApiOkResponse({ type: FileUrlResponse })
  completedFileUrl(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.documents.completedFileUrl(id, user);
  }

  @Get()
  @RequirePermission('documents', 'view')
  @ApiOperation({
    summary: 'List documents',
    description: 'Requires documents:view. Scoped to owned or shared-with (Admin/Super Admin see all).',
  })
  @ApiOkResponse({ type: DocumentResponse, isArray: true })
  list(@Query() query: ListDocumentsQuery, @CurrentUser() user: AuthUser) {
    return this.documents.list(query, user);
  }

  @Get(':id')
  @RequirePermission('documents', 'view')
  @ApiOperation({
    summary: 'Get a document (requests + per-signer status)',
    description: 'Requires documents:view. 404 if not visible to the caller.',
  })
  @ApiOkResponse({ type: DocumentResponse })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.documents.findOne(id, user);
  }

  @Post(':id/signature-requests')
  @RequirePermission('documents', 'create')
  @ApiOperation({
    summary: 'Share + request a signature from one or many recipients',
    description: 'Requires documents:create AND ownership of the document (else 403). Recipients become the shared-with set.',
  })
  @ApiCreatedResponse({ type: SignatureRequestResponse })
  requestSignature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSignatureRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.requestSignature(id, dto, user);
  }
}
