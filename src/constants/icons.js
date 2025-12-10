import * as AiIcons from "react-icons/ai";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as BsIcons from "react-icons/bs";
import * as BiIcons from "react-icons/bi";
import * as HiIcons from "react-icons/hi";
import * as Hi2Icons from "react-icons/hi2";
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import * as TbIcons from "react-icons/tb";
import * as CgIcons from "react-icons/cg";
import * as VscIcons from "react-icons/vsc";
import * as SlIcons from "react-icons/sl";
import * as TiIcons from "react-icons/ti";
import * as WiIcons from "react-icons/wi";
import * as CiIcons from "react-icons/ci";
import * as LuIcons from "react-icons/lu";
import * as RxIcons from "react-icons/rx";
import { AiOutlineInfoCircle } from "react-icons/ai";

export const iconPacks = {
  ai: AiIcons,
  fa: FaIcons,
  md: MdIcons,
  bs: BsIcons,
  bi: BiIcons,
  hi: HiIcons,
  hi2: Hi2Icons,
  io: IoIcons,
  io5: Io5Icons,
  tb: TbIcons,
  cg: CgIcons,
  vsc: VscIcons,
  sl: SlIcons,
  ti: TiIcons,
  wi: WiIcons,
  ci: CiIcons,
  lu: LuIcons,
  rx: RxIcons,
};

export const getIconComponentFromImport = (importString) => {
  if (!importString) return AiOutlineInfoCircle;

  const match = importString.match(
    /import\s+{\s*(\w+)\s*}\s+from\s+['"]react-icons\/([\w\d]+)['"]/i
  );
  if (!match) return AiOutlineInfoCircle;

  const iconName = match[1];
  const packPrefix = match[2].toLowerCase();
  const pack = iconPacks[packPrefix];

  return pack?.[iconName] || AiOutlineInfoCircle;
};
