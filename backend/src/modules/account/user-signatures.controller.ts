/**
 * UserSignaturesController — /v1/account/signatures. Every authenticated user manages their OWN saved,
 * reusable signatures (no module permission — own-scoped in the service). The image is uploaded as
 * multipart; bytes are served only via the own-scoped /file-url (short-TTL signed URL). — SRS §13
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { SuccessResponse } from '../../common/dto/success.response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { UploadedFile as UploadedFileShape } from '../../common/storage/storage.service';
import { FileUrlResponse } from '../documents/dto/document.response';
import { CreateUserSignatureDto } from './dto/user-signature.dto';
import { UserSignatureResponse } from './dto/user-signature.response';
import { UserSignaturesService } from './user-signatures.service';

const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024; // 2 MB — a signature image is small

@ApiTags('Account')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('account/signatures')
export class UserSignaturesController {
  constructor(private readonly signatures: UserSignaturesService) {}

  @Get()
  @ApiOperation({ summary: 'List my saved signatures', description: 'Authenticated; own-scoped.' })
  @ApiOkResponse({ type: UserSignatureResponse, isArray: true })
  list(@CurrentUser() user: AuthUser) {
    return this.signatures.list(user);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIGNATURE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        label: { type: 'string' },
        method: { type: 'string', enum: ['drawn', 'typed', 'uploaded'] },
      },
    },
  })
  @ApiOperation({
    summary: 'Save a reusable signature (image)',
    description: 'Authenticated; own-scoped. The first saved signature becomes the default.',
  })
  @ApiCreatedResponse({ type: UserSignatureResponse })
  create(
    @Body() dto: CreateUserSignatureDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpe?g|webp)$/ })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory: () => new UnprocessableEntityException('a PNG/JPEG/WebP image is required'),
        }),
    )
    file: UploadedFileShape,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signatures.create(dto, file, user);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Make a signature my default', description: 'Authenticated; own-scoped.' })
  @ApiOkResponse({ type: UserSignatureResponse })
  setDefault(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.signatures.setDefault(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved signature', description: 'Authenticated; own-scoped.' })
  @ApiOkResponse({ type: SuccessResponse })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.signatures.remove(id, user);
  }

  @Get(':id/file-url')
  @ApiOperation({
    summary: 'Get an access-controlled URL for my signature image',
    description: 'Authenticated; own-scoped. Returns a short-TTL signed URL.',
  })
  @ApiOkResponse({ type: FileUrlResponse })
  fileUrl(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.signatures.fileUrl(id, user);
  }
}
