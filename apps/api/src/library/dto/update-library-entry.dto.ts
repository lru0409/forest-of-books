import { PartialType } from '@nestjs/mapped-types';

import { CreateLibraryEntryNoteDto } from './create-library-entry.dto';

export class UpdateLibraryEntryDto extends PartialType(CreateLibraryEntryNoteDto) {}
